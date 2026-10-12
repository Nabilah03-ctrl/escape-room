(function(T){
  'use strict';
  class GestureFilter{
    constructor(){this.reset();}
    reset(){this.point=null;this.pinched=false;this.armed=false;this.closedFrames=0;this.openFrames=0;}
    update(landmarks,{width=640,height=480,range=.8}={}){
      if(!landmarks||landmarks.length<21){this.reset();return null;}
      const distance=(a,b)=>Math.hypot((a.x-b.x)*width,(a.y-b.y)*height);
      const scale=Math.max(distance(landmarks[0],landmarks[9]),distance(landmarks[5],landmarks[17]),15);
      const ratio=distance(landmarks[4],landmarks[8])/scale;
      const raw={x:Math.max(0,Math.min(1,(1-landmarks[8].x-(1-range)/2)/range)),y:Math.max(0,Math.min(1,(landmarks[8].y-(1-range)/2)/range))};
      this.point=this.point?{x:this.point.x*.62+raw.x*.38,y:this.point.y*.62+raw.y*.38}:raw;
      let event=null;
      if(ratio>.43){this.openFrames++;this.closedFrames=0;if(this.openFrames>=2){this.armed=true;if(this.pinched){this.pinched=false;event='release';}}}
      else if(ratio<.27){this.closedFrames++;this.openFrames=0;if(this.armed&&!this.pinched&&this.closedFrames>=2){this.pinched=true;event='press';}}
      else{this.closedFrames=0;this.openFrames=0;}
      return{...this.point,pinched:this.pinched,event,ratio};
    }
  }
  class DwellFilter{
    constructor(){this.reset();}
    reset(){this.target=null;this.started=0;this.fired=false;}
    update(target,now,duration=1200){if(target!==this.target){this.target=target;this.started=now;this.fired=false;}if(!target)return{progress:0,fire:false};const progress=Math.min(1,(now-this.started)/duration);const fire=progress>=1&&!this.fired;if(fire)this.fired=true;return{progress,fire};}
  }
  class InputHub{
    constructor({onActivate,onDrop,onMove,onMotor,onHold}){
      Object.assign(this,{onActivate,onDrop,onMove,onMotor,onHold});this.drag=null;this.hover=null;this.dwell=new DwellFilter();this.ignoreClickUntil=0;
      this.cursor=document.createElement('div');this.cursor.className='hand-cursor';this.cursor.hidden=true;this.cursor.setAttribute('aria-hidden','true');this.cursor.innerHTML='<span></span>';document.body.append(this.cursor);
      document.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-card]');if(!el||el.disabled||e.button>0)return;e.preventDefault();this.press(el,e.clientX,e.clientY,'mouse');el.setPointerCapture?.(e.pointerId);});
      document.addEventListener('pointermove',e=>{if(this.drag?.source==='mouse')this.move(e.clientX,e.clientY);this.onMove?.(e.clientX,e.clientY,'mouse');});
      document.addEventListener('pointerup',e=>{if(this.drag?.source==='mouse'){e.preventDefault();this.ignoreCard={...this.drag.data};this.ignoreClickUntil=performance.now()+200;this.release(e.clientX,e.clientY);}});
      document.addEventListener('pointercancel',()=>this.cancel());
      document.addEventListener('click',e=>{const el=e.target.closest('[data-action],[data-card],[data-slot]');if(!el||el.disabled)return;const duplicate=el.hasAttribute('data-card')&&el.dataset.comp===this.ignoreCard?.component&&Number(el.dataset.choice)===this.ignoreCard?.index;if(e.detail&&duplicate&&performance.now()<this.ignoreClickUntil){e.preventDefault();return;}if(el.closest('[inert]'))return;this.activate(el);});
      window.addEventListener('resize',()=>{this.cancel();this.dwell.reset();});
    }
    targetAt(x,y){const el=document.elementFromPoint(x,y)?.closest('[data-action],[data-card],[data-slot],summary');return el&&!el.disabled&&!el.closest('[inert]')?el:null;}
    activate(el,source='mouse'){if(!el||el.disabled||!el.isConnected||el.closest('[inert]'))return;if(el.tagName==='SUMMARY'){el.click();return;}this.onActivate(el,source);}
    press(el,x,y,source){this.cancel();if(!el||el.disabled)return;this.drag={el,x,y,source,moved:false,card:el.hasAttribute('data-card'),data:{component:el.dataset.comp,index:Number(el.dataset.choice)}};if(this.drag.card){this.onHold?.();el.classList.add('is-held');this.ghost=el.cloneNode(true);this.ghost.classList.add('drag-ghost');this.ghost.removeAttribute('id');this.ghost.setAttribute('aria-hidden','true');this.ghost.style.width=Math.min(280,el.offsetWidth)+'px';document.body.append(this.ghost);this.move(x,y);}this.cursor.dataset.state='holding';}
    move(x,y){if(this.drag){if(Math.hypot(x-this.drag.x,y-this.drag.y)>10)this.drag.moved=true;if(this.ghost){this.ghost.style.left=x+'px';this.ghost.style.top=y+'px';}}const target=this.targetAt(x,y);if(this.hover!==target){this.hover?.classList.remove('target-hover');this.hover=target;target?.classList.add('target-hover');}this.cursor.style.left=x+'px';this.cursor.style.top=y+'px';this.onMove?.(x,y,'hand');}
    release(x,y){const held=this.drag;if(!held)return;const target=this.targetAt(x,y);this.cancel();this.cursor.dataset.state='released';if(held.card&&held.moved){if(target?.hasAttribute('data-slot'))this.onDrop(held.data,target,held.source);else this.onMotor?.('Kad kembali ke tempat asal. Lepaskan pada ruang sasaran yang besar.');}else if(target===held.el||held.card&&!held.moved)this.activate(held.el,held.source);}
    cancel(){this.drag?.el?.classList.remove('is-held');this.drag=null;this.ghost?.remove();this.ghost=null;this.hover?.classList.remove('target-hover');this.hover=null;this.cursor.dataset.state='pointing';}
    hide(){this.cancel();this.cursor.hidden=true;this.dwell.reset();}
    hand(point,settings){this.cursor.hidden=false;const x=point.x*innerWidth,y=point.y*innerHeight;this.move(x,y);const target=this.targetAt(x,y);
      if(settings.activation==='dwell'){const key=target?(target.dataset.action||'')+'|'+(target.dataset.comp||'')+'|'+(target.dataset.choice||'')+'|'+(target.dataset.slot||'')+'|'+(target.dataset.door||'')+'|'+(target.dataset.key||'')+'|'+(target.dataset.value||'')+'|'+(target.dataset.index||''):null;const d=this.dwell.update(key,performance.now(),settings.dwellMs);this.cursor.style.setProperty('--dwell',d.progress*360+'deg');if(d.fire){this.cancel();this.activate(target,'hand');}}
      else{this.cursor.style.setProperty('--dwell','0deg');if(point.event==='press')this.press(target,x,y,'hand');if(point.event==='release')this.release(x,y);if(point.pinched)this.cursor.dataset.state='holding';}
    }
  }
  T.GestureFilter=GestureFilter;T.DwellFilter=DwellFilter;T.InputHub=InputHub;
})(window.Tiba);
