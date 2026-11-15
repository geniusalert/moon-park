import {calibrateHardware} from './hardware-thermal.js';
self.onmessage=event=>{
 try{const report=calibrateHardware(event.data,progress=>self.postMessage({progress}));self.postMessage({report});}
 catch(error){self.postMessage({error:error.message});}
};
