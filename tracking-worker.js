// All model inference stays in this worker on the user's device.
import {FilesetResolver,HandLandmarker} from './vendor/mediapipe/vision_bundle.mjs';
let detector;
self.onmessage=async({data})=>{
  try{
    if(data.type==='init'){
      // 1.1.0 requires the module Wasm loader inside an ES module worker.
      const files=await FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm',self.location.href).href,true);
      detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('./models/hand_landmarker.task',self.location.href).href,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55,canvas:new OffscreenCanvas(640,480)});
      self.postMessage({type:'ready'});
    }else if(data.type==='frame'&&detector){
      try{const result=detector.detectForVideo(data.bitmap,data.timestamp);self.postMessage({type:'result',landmarks:result.landmarks,handedness:result.handedness});}finally{data.bitmap.close();}
    }else if(data.type==='close'){detector?.close();self.close();}
  }catch(error){self.postMessage({type:'error',message:String(error.message||error)});}
};
