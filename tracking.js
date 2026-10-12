(function(T){
  'use strict';
  class HandTracker{
    constructor({settings,onPoint,onLost,onStatus,onCancel}){Object.assign(this,{settings,onPoint,onLost,onStatus,onCancel});this.filter=new T.GestureFilter();this.state='off';this.ready=false;this.detected=false;this.generation=0;this.preview=document.querySelector('#camera-preview');this.video=document.createElement('video');this.video.muted=true;this.video.playsInline=true;this.video.autoplay=true;this.video.setAttribute('aria-label','Pratonton kamera bercermin');this.preview.append(this.video);}
    status(state,message){this.state=state;this.message=message;this.onStatus?.({state,message,ready:this.ready,detected:this.detected});}
    async start(){
      this.stop();const generation=++this.generation;
      if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){this.status('error','Kamera memerlukan HTTPS atau localhost. Teruskan dengan tetikus.');return;}
      this.status('loading','Benarkan kamera. MIM sedang menyediakan pengesan tangan…');
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:20,max:30}},audio:false});
        if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
        this.stream=stream;this.video.srcObject=stream;
        await new Promise((resolve,reject)=>{this.videoTimer=setTimeout(()=>reject(Error('video-timeout')),15000);this.video.play().then(()=>{clearTimeout(this.videoTimer);resolve();},reject);});
        if(generation!==this.generation)return;
        this.worker=new Worker(new URL('tracking-worker.js',document.baseURI),{type:'module'});
        const worker=this.worker;
        await new Promise((resolve,reject)=>{
          this.rejectLoading=reject;this.loadTimer=setTimeout(()=>reject(Error('model-timeout')),45000);
          worker.onerror=(event)=>{console.error('[TIBA+ hand gesture] Ralat Worker semasa memuatkan model:',event.message||'Worker gagal dimuatkan',event.filename||'',event.lineno||'');reject(Error('Worker: '+(event.message||'gagal memuatkan modul')));};
          worker.onmessage=({data})=>{if(data.type==='ready'){clearTimeout(this.loadTimer);this.rejectLoading=null;resolve();}else if(data.type==='error'){console.error('[TIBA+ hand gesture] Ralat MediaPipe:',data.message);reject(Error('MediaPipe: '+data.message));}};
          worker.postMessage({type:'init'});
        });
        if(generation!==this.generation)return;
        this.ready=true;this.detected=false;this.busy=false;this.lastInference=0;this.lastFrameAt=performance.now();this.lostSince=performance.now();this.lossAnnounced=false;
        worker.onerror=(event)=>{console.error('[TIBA+ hand gesture] Worker berhenti:',event.message||'Ralat tidak diketahui');this.fail('Model tidak dapat berjalan. Semak tab Console. Gunakan tetikus untuk meneruskan.');};
        worker.onmessage=({data})=>{this.busy=false;this.lastFrameAt=performance.now();if(data.type==='result')this.accept(data);else if(data.type==='error'){console.error('[TIBA+ hand gesture] Ralat semasa mengesan tangan:',data.message);this.fail('Pengesan tangan terhenti: '+String(data.message||'tidak diketahui').slice(0,140)+'. Gunakan tetikus untuk meneruskan.');}};
        stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(generation===this.generation)this.fail('Kamera terputus. Aktifkan semula atau pilih tetikus.');}));
        this.status('searching','Tangan belum dikesan');this.loop();
      }catch(error){if(generation!==this.generation)return;const denied=['NotAllowedError','PermissionDeniedError','SecurityError'].includes(error.name);const missing=['NotFoundError','DevicesNotFoundError','NotReadableError'].includes(error.name);console.error('[TIBA+ hand gesture] Punca sebenar gagal aktifkan kamera/model:',error);const detail=String(error?.message||error||'ralat tidak diketahui').replace(/[\r\n]+/g,' ').slice(0,180);this.fail(denied?'Izin kamera tidak diberikan. Kamu boleh bermain dengan tetikus.':missing?'Kamera tidak tersedia atau sedang digunakan. Teruskan dengan tetikus.':`Model tangan tidak dapat dimuatkan (${detail}). Semak Console; teruskan dengan tetikus.`);}
    }
    accept(data){
      const handedness=data.handedness?.[0]?.[0]?.categoryName?.toLowerCase(),wanted=this.settings().hand;
      // MediaPipe handedness is mirrored for a front-facing, unmirrored input.
      const actual=handedness==='left'?'right':handedness==='right'?'left':null;
      const landmarks=data.landmarks?.[0];
      if(!landmarks||(wanted!=='either'&&actual&&wanted!==actual)){this.missing(wanted!=='either'&&landmarks?'Gunakan tangan pilihan, atau pilih “Mana-mana tangan”.':'Tangan belum dikesan');return;}
      const was=this.detected;this.detected=true;this.lostSince=null;this.lossAnnounced=false;
      if(!was)this.status('tracking','Tangan dikesan');
      const point=this.filter.update(landmarks,{width:this.video.videoWidth||640,height:this.video.videoHeight||480,range:this.settings().range});if(point)this.onPoint(point);
    }
    missing(message='Tangan belum dikesan'){if(this.detected){this.detected=false;this.filter.reset();this.onCancel();this.status('searching',message);}if(this.lostSince===null||this.lostSince===undefined)this.lostSince=performance.now();if(performance.now()-this.lostSince>1400&&!this.lossAnnounced){this.lossAnnounced=true;this.onLost();}}
    loop(){
      if(!this.ready)return;
      const now=performance.now();
      // A background tab deliberately stops inference; this is not a model stall.
      if(document.hidden){this.lastFrameAt=now;this.frameTimer=setTimeout(()=>this.loop(),250);return;}
      if(now-this.lastFrameAt>1400)this.missing();
      if(now-this.lastFrameAt>8000){this.fail('Kamera atau model tidak memberi respons. Gunakan tetikus untuk meneruskan.');return;}
      if(!this.busy&&now-this.lastInference>=80&&this.video.readyState>=2){
        this.busy=true;this.lastInference=now;const generation=this.generation;
        createImageBitmap(this.video).then(bitmap=>{if(generation!==this.generation||!this.worker){bitmap.close();return;}this.worker.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);}).catch(()=>{this.busy=false;this.missing();});
      }
      this.frameTimer=setTimeout(()=>this.loop(),35);
    }
    fail(message){this.stop(false);this.status('error',message);this.onLost();}
    stop(announce=true){this.generation++;clearTimeout(this.videoTimer);clearTimeout(this.loadTimer);clearTimeout(this.frameTimer);this.rejectLoading?.(Error('cancelled'));this.rejectLoading=null;this.worker?.terminate();this.worker=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.pause();this.video.srcObject=null;this.ready=false;this.detected=false;this.filter.reset();this.onCancel?.();if(announce)this.status('off','Kamera dimatikan');}
    showPreview(show){this.preview.hidden=!show||!this.stream;}
  }
  T.HandTracker=HandTracker;
})(window.Tiba);
