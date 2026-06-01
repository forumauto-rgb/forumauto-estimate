<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>フォーラムオート｜ご相談窓口</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
:root{--bg:#f5f0eb;--white:#fff;--primary:#c0392b;--primary-light:#e74c3c;--dark:#2c2c2c;--mid:#666;--light:#999;--border:#e0d8d0;--bubble-user:#fff3e0;--shadow:0 2px 12px rgba(0,0,0,.08);}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{font-family:'Noto Sans JP',sans-serif;background:var(--bg);color:var(--dark);min-height:100vh;font-size:15px;}
.chat-screen{display:flex;flex-direction:column;height:100vh;}
.chat-header{background:var(--white);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:10;box-shadow:0 1px 8px rgba(0,0,0,.06);}
.staff-avatar{width:46px;height:46px;border-radius:50%;background:#fff0f0;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.staff-info h4{font-size:15px;font-weight:700;}
.staff-info p{font-size:11px;color:var(--light);}
.online-dot{width:8px;height:8px;background:#2ecc71;border-radius:50%;margin-left:auto;flex-shrink:0;}
.chat-messages{flex:1;overflow-y:auto;padding:16px 14px 20px;display:flex;flex-direction:column;gap:14px;}
.msg-row{display:flex;align-items:flex-end;gap:8px;}
.msg-row.user{flex-direction:row-reverse;}
.msg-avatar{width:34px;height:34px;border-radius:50%;background:#fff0f0;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.bubble{max-width:80%;padding:12px 15px;border-radius:18px;font-size:14px;line-height:1.7;box-shadow:0 1px 4px rgba(0,0,0,.07);white-space:pre-wrap;}
.bubble.staff{background:var(--white);border-bottom-left-radius:4px;}
.bubble.user{background:var(--bubble-user);border-bottom-right-radius:4px;}
.bubble-time{font-size:10px;color:var(--light);margin-top:3px;padding:0 4px;}
.choices{display:flex;flex-direction:column;gap:8px;margin-top:6px;padding-left:42px;}
.choice-btn{background:var(--white);border:1.5px solid var(--border);border-radius:50px;padding:11px 18px;font-size:14px;font-family:'Noto Sans JP',sans-serif;cursor:pointer;text-align:left;color:var(--dark);box-shadow:0 1px 4px rgba(0,0,0,.05);transition:all .15s;}
.choice-btn:active{background:#fff0f0;border-color:var(--primary);color:var(--primary);}
.choice-btn.selected{background:#fff0f0;border-color:var(--primary);color:var(--primary);pointer-events:none;}
.typing{display:flex;align-items:center;gap:4px;padding:12px 15px;}
.dot{width:7px;height:7px;background:var(--light);border-radius:50%;animation:bounce 1.2s infinite;}
.dot:nth-child(2){animation-delay:.2s;}
.dot:nth-child(3){animation-delay:.4s;}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.chat-input-area{background:var(--white);border-top:1px solid var(--border);padding:10px 14px;display:flex;gap:8px;align-items:flex-end;}
.chat-input{flex:1;border:1.5px solid var(--border);border-radius:22px;padding:10px 16px;font-size:16px;font-family:'Noto Sans JP',sans-serif;outline:none;resize:none;max-height:100px;line-height:1.5;color:var(--dark);}
.chat-input:focus{border-color:var(--primary);}
.send-btn{width:44px;height:44px;background:var(--primary);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:#fff;}
.send-btn:active{background:var(--primary-light);}
.cta-block{background:#fff8f0;border:1.5px solid #f0d0b0;border-radius:14px;padding:16px;margin-top:4px;margin-left:42px;}
.cta-block p{font-size:13px;color:var(--mid);margin-bottom:12px;line-height:1.6;}
.cta-tel{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--primary);color:#fff;border-radius:50px;padding:13px;font-weight:700;font-size:16px;text-decoration:none;margin-bottom:8px;}
.cta-line{display:flex;align-items:center;justify-content:center;gap:8px;background:#06c755;color:#fff;border-radius:50px;padding:11px;font-weight:700;font-size:14px;text-decoration:none;}
</style>
</head>
<body>
<div class="chat-screen">
  <div class="chat-header">
    <div class="staff-avatar">👩</div>
    <div class="staff-info">
      <h4>サキ（受付スタッフ）</h4>
      <p>フォーラムオート｜なんでもご相談ください</p>
    </div>
    <div class="online-dot"></div>
  </div>
  <div class="chat-messages" id="chatMessages"></div>
  <div class="chat-input-area">
    <textarea class="chat-input" id="chatInput" placeholder="メッセージを入力..." rows="1"
      oninput="autoResize(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}"></textarea>
    <button class="send-btn" onclick="sendMsg()">➤</button>
  </div>
</div>

<script>
var TEL = '0538-49-0632';
var CHAT_API = '/api/chat';
var convHistory = [];

var SAKI_SYSTEM = 'あなたはフォーラムオート（静岡県袋井市下山梨545）の受付スタッフ「サキ」です。明るく親しみやすい女性で、お客様に寄り添って対応します。\\n\\n【会社の特徴】\\n・1968年創業、57年の家族経営の鈑金塗装専門店\\n・丁寧で高品質な仕上げ（時間をかけてきれいに仕上げる）\\n・混み合う時期は予約をお願いすることもある\\n・電話：0538-49-0632\\n・営業時間 8:30〜18:00（日祝休）\\n\\n【鈑金塗装の専門知識】\\n・バンパーは樹脂製。サビない、板金はしない。こすり傷はパテ修正＋塗装で対応可、大きな割れ・亀裂は交換推奨\\n・ドア/フェンダー/ボンネット/トランク/ルーフは鉄板。サビ注意、板金で形を戻して塗装\\n・サイドミラーはカバーのみ交換/ミラー交換/アッセンブリー交換に分かれる\\n・ホイールはリペアか交換、タイヤは基本交換\\n・国産大衆車は部品代が安いので交換がおすすめ。外車・高級車は部品代が高くても修理の価値がある。亀裂修理は高額になるので10万円以上の部品でないと交換の方が得\\n・最近は塗料や部品の価格が高騰している\\n\\n【対応方針】\\n・事故やトラブルで動揺しているお客様には必ず共感から入る（「大変でしたね」「お怪我はありませんでしたか」など）\\n・相手の気持ちに寄り添い、安心させることを最優先\\n・展開を急がず、まず状況を丁寧に聞く\\n・自費だと高額になる場合は保険使用をさりげなく勧める\\n・車両保険未加入の方には次回更新での加入を勧める\\n・最終的に来店・電話・LINEでの写真送付に自然に誘導する\\n・1回の返答は3〜5文程度。絵文字を適度に使い親しみやすく\\n・具体的な金額は言い切らず「見積りしてみないと」「〜円程度」とする\\n・当て逃げ・事故の場合は警察への届け出（物損事故）が保険請求に必要なことを伝える\\n・専門外の質問や答えられないことは、正直に「実際に見せていただくのが確実です」と来店を案内する';

function getTime(){var d=new Date();return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');}

function addStaffMsg(text){
  var box=document.getElementById('chatMessages');
  var row=document.createElement('div');
  row.className='msg-row';
  row.innerHTML='<div class="msg-avatar">👩</div><div><div class="bubble staff">'+text+'</div><div class="bubble-time">'+getTime()+'</div></div>';
  box.appendChild(row);scrollBottom();
}

function addUserMsg(text){
  var box=document.getElementById('chatMessages');
  var row=document.createElement('div');
  row.className='msg-row user';
  row.innerHTML='<div><div class="bubble user">'+text+'</div><div class="bubble-time" style="text-align:right">'+getTime()+'</div></div>';
  box.appendChild(row);scrollBottom();
}

function addChoices(items,callback){
  var box=document.getElementById('chatMessages');
  var div=document.createElement('div');
  div.className='choices';
  items.forEach(function(item){
    var btn=document.createElement('button');
    btn.className='choice-btn';
    btn.textContent=item;
    btn.onclick=function(){
      div.querySelectorAll('.choice-btn').forEach(function(b){b.disabled=true;});
      btn.classList.add('selected');
      addUserMsg(item);
      setTimeout(function(){callback(item);},300);
    };
    div.appendChild(btn);
  });
  box.appendChild(div);scrollBottom();
}

function addTyping(){
  var box=document.getElementById('chatMessages');
  var row=document.createElement('div');
  row.className='msg-row';row.id='typing';
  row.innerHTML='<div class="msg-avatar">👩</div><div class="bubble staff typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  box.appendChild(row);scrollBottom();
}
function removeTyping(){var t=document.getElementById('typing');if(t)t.remove();}

function addCTA(){
  var box=document.getElementById('chatMessages');
  var div=document.createElement('div');
  div.innerHTML='<div class="cta-block"><p>📍 静岡県袋井市下山梨545<br>お気軽にご連絡・ご来店ください😊</p>'
    +'<a href="tel:'+TEL+'" class="cta-tel">📞 '+TEL+'に電話する</a>'
    +'<a href="https://line.me/ti/g/dUCBJhxCE-" class="cta-line">💬 LINEで写真を送る</a></div>';
  box.appendChild(div);scrollBottom();
}

function scrollBottom(){var box=document.getElementById('chatMessages');setTimeout(function(){box.scrollTop=box.scrollHeight;},100);}

function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}

// 起動時のあいさつと選択肢
window.onload=function(){
  setTimeout(function(){
    addStaffMsg('こんにちは😊 フォーラムオートのサキです。\\nお車のことでご不安なことがあれば\\nどんな小さなことでもお気軽にお話しください。\\n一緒に考えますね🙏');
    setTimeout(function(){
      addStaffMsg('今日はどういったことでお困りですか？\\n下から選んでいただいても、\\n直接メッセージを書いていただいても大丈夫です😊');
      addChoices([
        '🚗 車をぶつけてしまった',
        '🔍 キズやへこみに気づいた',
        '🚙 当て逃げ・事故にあった',
        '💰 修理費用を知りたい',
        '🛡️ 保険で直せるか相談したい',
        '✏️ 自分で入力して相談する'
      ], handleFirstChoice);
    },900);
  },500);
};

function handleFirstChoice(ans){
  if(ans.includes('入力')){
    addStaffMsg('どうぞお気軽にお書きください😊\\n下の入力欄からなんでもご相談くださいね。');
    return;
  }
  // 選んだ内容をAIに送って会話開始
  convHistory.push({role:'user',content:ans});
  callAI();
}

async function sendMsg(){
  var input=document.getElementById('chatInput');
  var text=input.value.trim();
  if(!text)return;
  input.value='';input.style.height='auto';
  addUserMsg(text);
  convHistory.push({role:'user',content:text});
  callAI();
}

async function callAI(){
  addTyping();
  try{
    var res=await fetch(CHAT_API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:convHistory,system:SAKI_SYSTEM})
    });
    var data=await res.json();
    var reply=(data.content||[]).map(function(b){return b.text||'';}).join('')||'すみません、もう一度お願いできますか？';
    removeTyping();
    addStaffMsg(reply);
    convHistory.push({role:'assistant',content:reply});
    // 会話が進んだらCTAを出す
    if(convHistory.length>=6 && !document.querySelector('.cta-block')){
      setTimeout(addCTA,600);
    }
  }catch(e){
    removeTyping();
    addStaffMsg('すみません、少し調子が悪いようです😅\\nお急ぎの場合はお電話ください。\\n0538-49-0632です。');
    if(!document.querySelector('.cta-block')) setTimeout(addCTA,400);
  }
}
</script>
</body>
</html>
