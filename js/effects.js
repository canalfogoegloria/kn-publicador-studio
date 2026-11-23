/* KN V3 — partículas e luzes desenhadas em camadas realmente transparentes. */
(function(){
 'use strict';const KN=window.KN=window.KN||{};
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const rand=(n,s=1)=>{let x=Math.sin(n*127.1+s*311.7)*43758.5453;return x-Math.floor(x);};
 function render(ctx,w,h,time,opt={}){
  const type=opt.effect||'none',strength=clamp(Number(opt.density)||0,0,100)/100;
  const speed=.3+clamp(Number(opt.speed)||0,0,100)/100*1.8;
  const unit=Math.min(w,h)/1080;
  ctx.save();
  if(type!=='none'&&strength>0){
   const count=Math.min(110,Math.floor(10+strength*83));
   for(let i=0;i<count;i++){
    const r=rand(i+1),r2=rand(i+1,2),r3=rand(i+1,3),r4=rand(i+1,4);
    let x=r*w,y=r2*h,size=1.8+(r3*5.6)*unit;
    const fall=(r2+time*speed*(.035+.04*r3))%1.3;
    if(['snow','rain','petals','embers'].includes(type)){
     y=(fall*1.3-.15)*h;
     x=((r+Math.sin(time*.9+r2*12)*.022+time*(type==='embers'?.005:.003)*speed)%1)*w;
    }else{
     y=((r2+time*speed*.009*(r3+.2))%1)*h;
     x=(r+.018*Math.sin(time*.55+i))%1*w;
    }
    let alpha=(.15+.45*r3)*Math.min(1,strength*1.6+.3);
    ctx.globalAlpha=alpha;
    if(type==='snow'){
     size=(2.4+r3*7)*unit;ctx.fillStyle='#fff';ctx.shadowColor='#ebf8ff';ctx.shadowBlur=6*unit;
     ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
    }else if(type==='rain'){
     ctx.strokeStyle='#add5e8';ctx.lineWidth=(1+r3)*unit;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5*unit,y+(17+r3*38)*unit);ctx.stroke();
    }else if(type==='gold'||type==='dust'||type==='bokeh'||type==='embers'){
     if(type==='gold'){ctx.fillStyle='#f7d27c';ctx.shadowColor='#ffd36b';ctx.shadowBlur=12*unit;size=(1.5+r3*4)*unit;}
     if(type==='dust'){ctx.fillStyle='#dbc5a3';ctx.shadowColor='#c0a27b';ctx.shadowBlur=5*unit;size=(1+r3*3)*unit;}
     if(type==='bokeh'){ctx.fillStyle=r3>.5?'#c4eefa':'#ffe1b1';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=16*unit;size=(8+r3*22)*unit;ctx.globalAlpha*=.50;}
     if(type==='embers'){ctx.fillStyle='#ff924b';ctx.shadowColor='#ffbd66';ctx.shadowBlur=12*unit;size=(2+r3*5)*unit;y=h-y;}
     ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
    }else if(type==='petals'){
     ctx.save();ctx.fillStyle=r3>.5?'#f2b8ca':'#f1d4ba';ctx.translate(x,y);ctx.rotate(Math.sin(time+i)*.6);
     ctx.beginPath();ctx.ellipse(0,0,(3+r3*5)*unit,(7+r3*10)*unit,.45,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.shadowBlur=0;
   }
  }
  const light=opt.light||'none';
  if(light!=='none'){
   const pulse=.8+.2*Math.sin(time*.8),cx=w*(.23+.03*Math.sin(time*.2)),cy=h*.23;
   if(light==='gold'||light==='blue'||light==='warm'){
    const tint=light==='blue'?'110,186,255':light==='warm'?'255,151,108':'255,212,128';
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.8);
    g.addColorStop(0,`rgba(${tint},${.27*pulse})`);g.addColorStop(.4,`rgba(${tint},${.09*pulse})`);g.addColorStop(1,`rgba(${tint},0)`);
    ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
   }else if(light==='beam'){
    const X=w*(.15+.11*Math.sin(time*.23));ctx.globalAlpha=.26*pulse;
    const g=ctx.createLinearGradient(X,0,X+w*.55,h);g.addColorStop(0,'rgba(255,226,163,.8)');g.addColorStop(1,'rgba(255,226,163,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(X,0);ctx.lineTo(X+w*.27,0);ctx.lineTo(X+w*.72,h);ctx.lineTo(X-w*.18,h);ctx.closePath();ctx.fill();
   }else if(light==='flare'){
    const X=w*(.12+.72*(time%10)/10),Y=h*.22;
    for(const [rad,alpha] of [[w*.25,.13],[w*.08,.22],[w*.018,.54]]){
     const g=ctx.createRadialGradient(X,Y,0,X,Y,rad);g.addColorStop(0,`rgba(255,239,190,${alpha})`);g.addColorStop(1,'rgba(255,219,139,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(X-rad,Y-rad,rad*2,rad*2);
    }
   }
  }
  ctx.restore();
 }
 KN.effects={render};
})();
