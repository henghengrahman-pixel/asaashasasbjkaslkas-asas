import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { LiveChatClient } from '../src/livechat.js';

function listen(server){ return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port))); }
function close(server){ return new Promise(resolve=>server.close(resolve)); }

test('LiveChat list_chats follows next_page_id across 3 pages and deduplicates chat ids', async()=>{
  const seenBodies=[];
  const server=http.createServer((req,res)=>{
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',()=>{
      const parsed=body?JSON.parse(body):{};
      seenBodies.push(parsed);
      res.setHeader('content-type','application/json');
      const page=parsed.page_id||'';
      if(!page) return res.end(JSON.stringify({chats_summary:[
        {id:'c1',is_followed:true,last_thread_summary:{active:true}},
        {id:'c2',is_followed:true,last_thread_summary:{active:true}}
      ],next_page_id:'p2'}));
      if(page==='p2') return res.end(JSON.stringify({chats_summary:[
        {id:'c2',is_followed:true,last_thread_summary:{active:true}},
        {id:'c3',is_followed:true,last_thread_summary:{active:true}}
      ],next_page_id:'p3'}));
      if(page==='p3') return res.end(JSON.stringify({chats_summary:[
        {id:'c4',is_followed:true,last_thread_summary:{active:true}}
      ]}));
      res.statusCode=400; return res.end(JSON.stringify({error:{message:'bad page'}}));
    });
  });
  const port=await listen(server);
  try{
    const lc=new LiveChatClient({base:`http://127.0.0.1:${port}/v3.5/agent/action`,accountId:'acc',pat:'pat'});
    const result=await lc.listChats();
    assert.equal(result._pagesFetched,3);
    assert.equal(result._rawCount,5);
    assert.equal(result._deduplicatedCount,4);
    assert.equal(result._duplicateCount,1);
    assert.deepEqual(result._normalizedChats.map(x=>x.id),['c1','c2','c3','c4']);
    assert.equal(seenBodies.length,3);
    assert.equal(seenBodies[1].page_id,'p2');
    assert.equal(seenBodies[2].page_id,'p3');
  } finally { await close(server); }
});
