// AIマニュアル検索の❓フローティングボタン(#manualFloat)をドラッグ移動可能にする
// - マウス/タッチ共通(Pointer Events)。6px未満の移動はタップ扱いでチャットを開く
// - 位置は画面サイズに対する割合でlocalStorageに画面ごとに保存
// - resize時は現在位置を画面内に収めるだけ(キーボードやアドレスバーの出入りで跳ねないように)
// - orientationchange時のみ保存した割合から再計算
(function(){
  var box=document.getElementById('manualFloat');
  if(!box)return;
  var btn=box.querySelector('button');
  if(!btn)return;
  var KEY='fa_manualFloatPos_'+(location.pathname.split('/').pop()||'index.html');
  var MARGIN=8,THRESHOLD=6;
  var drag=null,moved=false;

  btn.style.touchAction='none';
  btn.style.userSelect='none';
  btn.style.webkitUserSelect='none';
  btn.style.webkitTouchCallout='none';

  function place(x,y){
    var maxX=Math.max(MARGIN,window.innerWidth-box.offsetWidth-MARGIN);
    var maxY=Math.max(MARGIN,window.innerHeight-box.offsetHeight-MARGIN);
    x=Math.min(Math.max(x,MARGIN),maxX);
    y=Math.min(Math.max(y,MARGIN),maxY);
    box.style.left=x+'px';
    box.style.top=y+'px';
    box.style.right='auto';
    box.style.bottom='auto';
  }
  function save(){
    var r=box.getBoundingClientRect();
    try{localStorage.setItem(KEY,JSON.stringify({rx:r.left/window.innerWidth,ry:r.top/window.innerHeight}));}catch(e){}
  }
  function restoreFromSaved(){
    var s=null;
    try{s=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
    if(s&&typeof s.rx==='number'&&typeof s.ry==='number'){
      place(s.rx*window.innerWidth,s.ry*window.innerHeight);
      return true;
    }
    return false;
  }
  function clampCurrent(){
    // 一度も動かしていない(CSSのright/bottom指定のまま)なら何もしない
    if(!box.style.left)return;
    var r=box.getBoundingClientRect();
    place(r.left,r.top);
  }

  btn.addEventListener('pointerdown',function(e){
    if(e.button)return;
    var r=box.getBoundingClientRect();
    drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:r.left,oy:r.top};
    moved=false;
    try{btn.setPointerCapture(e.pointerId);}catch(err){}
  });
  btn.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==drag.id)return;
    var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
    if(!moved&&Math.abs(dx)<THRESHOLD&&Math.abs(dy)<THRESHOLD)return;
    moved=true;
    e.preventDefault();
    place(drag.ox+dx,drag.oy+dy);
  });
  function end(e){
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;
    if(moved)save();
  }
  btn.addEventListener('pointerup',end);
  btn.addEventListener('pointercancel',end);
  // ドラッグ直後のクリックはボタンのonclick(openManualChat)に届く前に親で止める
  box.addEventListener('click',function(e){
    if(moved){
      moved=false;
      e.stopPropagation();
      e.preventDefault();
    }
  },true);

  window.addEventListener('resize',clampCurrent);
  window.addEventListener('orientationchange',function(){
    setTimeout(function(){
      if(!restoreFromSaved())clampCurrent();
    },300);
  });

  restoreFromSaved();
})();
