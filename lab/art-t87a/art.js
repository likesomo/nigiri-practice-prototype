/* T87-a 시각 계층: 게임 상태를 읽기만 한다. 입력·악보·판정·점수를 쓰지 않는다. */
(()=>{
 'use strict';
 const root=document.querySelector('#rxRoot'),rx=window.__rx;
 if(!root||!rx)return;
 // 원본이 부팅 중 추가한 스타일 다음에 새 아트 스타일을 배치한다.
 document.head.append(document.querySelector('link[href="art-t87a/art.css"]'));
 const base='art-t87a/assets/',images=new Map(),effects=new Set();
 const stats={버전:'T87-a.1',준비:false,드로우콜:0,자세갱신:0,팔레트갱신:0,진행중효과갱신:0,WebGL실패:0};
 const names=['master-neutral','master-happy','master-stern',...['wait','happy','angry'].flatMap(s=>[1,2,3].map(i=>'guest'+i+'-'+s)),...'process-wet process-shape process-squeeze process-flip process-trim process-place fish-gwangeo fish-yeoneo fish-saeu fish-anago fish-daebaetsal result-platter'.split(' ')];
 async function load(name){
  const im=new Image();im.decoding='async';im.src=base+name+'.png';await im.decode();images.set(name,im);return im;
 }
 const ready=Promise.all([...names.map(load),...names.filter(n=>n.startsWith('master')||n.startsWith('guest')).map(n=>load(n+'-map'))]);
 const vertex='attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.0)*0.5,(1.0-p.y)*0.5);gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision highp float;
 varying vec2 uv;uniform sampler2D colorMap;uniform sampler2D bakedMap;uniform vec2 size;uniform vec3 light;
 void main(){
  vec4 c=texture2D(colorMap,uv),m=texture2D(bakedMap,uv);
  vec2 xy=m.rg*2.-1.;vec3 normal=normalize(vec3(xy,sqrt(max(.01,1.-dot(xy,xy)))));
  float luminosity=m.b+(dot(normal,light)-.75)*.055;
  float shadow=1.-luminosity;
  float deep=smoothstep(.64,.86,shadow)*(1.-m.a)*step(.96,c.a);
  vec2 fixedPixel=uv*size;vec2 cell=(floor(fixedPixel/10.)+.5)*10.;
  vec4 center=texture2D(bakedMap,cell/size);
  float centerDeep=smoothstep(.64,.86,1.-center.b+(dot(normal,light)-.75)*-.055)*(1.-center.a);
  float radius=mix(.35,3.2,centerDeep);
  float dotMask=(1.-smoothstep(radius-.45,radius+.45,length(fixedPixel-cell)))*deep;
  vec3 ink=vec3(.16,.10,.075);c.rgb=mix(c.rgb,ink,dotMask*.38);
  gl_FragColor=c;
 }`;
 function effect(parent,name){
  try{return makeEffect(parent,name);}catch{stats.WebGL실패++;return null;}
 }
 function makeEffect(parent,name){
  const canvas=document.createElement('canvas');canvas.className='artGpu';canvas.setAttribute('aria-hidden','true');
  const color=images.get(name),map=images.get(name+'-map');if(!color||!map)return null;
  canvas.width=color.naturalWidth;canvas.height=color.naturalHeight;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,depth:false,stencil:false});
  if(!gl){stats.WebGL실패++;return null;}
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  for(const [i,im,uniform] of [[0,color,'colorMap'],[1,map,'bakedMap']]){
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.uniform1i(gl.getUniformLocation(program,uniform),i);
  }
  gl.uniform2f(gl.getUniformLocation(program,'size'),canvas.width,canvas.height);
  const lamp=gl.getUniformLocation(program,'light');if(getComputedStyle(parent).position==='static')parent.style.position='relative';parent.append(canvas);
  const e={parent,canvas,draw(t){
   gl.uniform3f(lamp,Math.cos(t*.21)*.28,Math.sin(t*.17)*.24,.92);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);stats.드로우콜++;
  },dispose(){gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}};
  effects.add(e);return e;
 }
 function artImage(name){const im=images.get(name)?.cloneNode()||new Image();im.src=base+name+'.png';im.alt='';im.draggable=false;im.className='artStaticImage';return im;}
 function decorate(){
  // 정적인 화면의 사람·완성 그림만 바꾼다. 실제 판 중의 표정 교체는 원본 어댑터가 한다.
  if(rx.X.mode==='play')return;
  const menu=document.querySelector('#rxMenu');
  if(menu&&!menu.hidden&&!menu.querySelector('.artMenuPortrait')){
   const portrait=document.createElement('div');portrait.className='artMenuPortrait artPose';portrait.append(artImage('master-happy'));menu.append(portrait);effect(portrait,'master-happy');
   const dish=artImage('result-platter');dish.className='artMenuDish';menu.append(dish);
  }
  for(const face of document.querySelectorAll('.rxFace,.rxBrFace')){
   if(face.dataset.t87a)continue;face.dataset.t87a='1';face.classList.add('artPose');
   const source=face.querySelector('img')?.getAttribute('src')||'';
   const name=['master-happy','master-stern','master-neutral'].find(n=>source.includes(n))||'master-happy';
   face.replaceChildren(artImage(name));effect(face,name);
  }
  const stage=rx.X.C?.stage,fish=stage?.neta?'fish-'+stage.neta:'result-platter';
  for(const plate of document.querySelectorAll('#rxResult .rxPlate>svg,#rxResult .rxPlates>div>svg')){
   const im=artImage(images.has(fish)?fish:'result-platter');
   const finale=rx.X.run?.result?.finale;
   if(finale)im.style.transform=`translateX(${(finale.dx||0)*.15}px) rotate(${finale.rot||0}deg)`;
   plate.replaceWith(im);
  }
 }
 let seed=8701,colors=['#ed7852','#2c9592','#db9a39','#9a6bb0'],from=colors[0],to=colors[1],at=0,duration=4000,poseAt=0;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const mix=(a,b,p)=>{a=rgb(a);b=rgb(b);return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*p).toString(16).padStart(2,'0')).join('');};
 let idleTime=0,lastTime=performance.now(),lastMode='';
 function update(){
  const now=performance.now(),mode=rx.X.mode;
  // 판 전체(카운트·브레이크 포함)에서 광원·자세·팔레트 시계를 동결한다.
  if(mode==='play'||!stats.준비){lastTime=now;lastMode=mode;setTimeout(update,250);return;}
  const staticScreen=['menu','result','bridge'].includes(mode);
  if(!staticScreen){lastTime=now;setTimeout(update,250);return;}
  idleTime+=Math.min(100,now-lastTime);lastTime=now;
  if(lastMode!==mode){decorate();lastMode=mode;}
  for(const e of [...effects]){
   if(!e.parent.isConnected){e.dispose();effects.delete(e);continue;}
   if(e.parent.closest('[hidden]'))continue;e.draw(idleTime/1000);
  }
  if(idleTime-poseAt>=1000/6){
   poseAt=idleTime;
   if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
    for(const e of document.querySelectorAll('.artPose'))if(!e.closest('[hidden]')){
     e.style.translate=`0 ${Math.sin(idleTime*.001)*1.4}px`;stats.자세갱신++;
    }
   }
  }
  if(idleTime-at>=duration){from=to;to=colors[Math.floor(rnd()*colors.length)];duration=3000+rnd()*4000;at=idleTime;}
  const p=Math.min(1,(idleTime-at)/duration),ease=p*p*(3-2*p);
  root.style.setProperty('--art-accent',mix(from,to,ease));stats.팔레트갱신++;
  setTimeout(update,1000/12);
 }
 ready.then(()=>{stats.준비=true;decorate();lastMode=rx.X.mode;update();});
 window.__t87a={stats,ready,이미지수:names.length,효과:'캐릭터당 단일 WebGL drawArrays / 12Hz, 자세 6Hz, 판 진행 중 동결'};
})();
