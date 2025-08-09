// 간단한 물리 엔진: 구(Sphere)와 평면/박스의 충돌 + 중력 + 통합(Explicit Euler)
// 목적: 가벼운 데모용; 고정밀 물리 시엔 ammo.js, cannon-es, rapier 등을 권장.

window.Physics = (function(){
  const gravity = new THREE.Vector3(0, -9.81, 0);
  let world = [];
  let dt = 1/60;

  function setGravity(y){ gravity.set(0,y,0); }
  function step(delta){
    // 고정된 서브스텝(안정성 향상)
    const steps = Math.max(1, Math.ceil(delta / (1/60)));
    const sub = delta / steps;
    for(let s=0;s<steps;s++) integrate(sub);
  }

  function integrate(t){
    // 외력 적용 -> 단순한 질량중심 운동 (회전 없음)
    for(const b of world){
      if(b.invMass === 0) continue; // 고정된 오브젝트
      // 중력
      b.velocity.addScaledVector(gravity, t);
      // 간단한 공기저항
      b.velocity.multiplyScalar(0.999);
      // 위치 업데이트
      b.position.addScaledVector(b.velocity, t);
    }

    // 충돌 처리 (간단한 충돌해결: 구-평면, 구-구, 구-AABB)
    // 평면: y = 0 (바닥)
    for(const b of world){
      if(b.shape === 'sphere'){
        // 바닥 충돌
        const r = b.radius;
        if(b.position.y - r < 0){
          b.position.y = r;
          if(b.velocity.y < 0) b.velocity.y = -b.velocity.y * (b.restitution || 0.4);
          // 마찰 (간단)
          b.velocity.x *= 0.9; b.velocity.z *= 0.9;
        }
      } else if(b.shape === 'box'){
        // box AABB vs floor
        const minY = b.position.y - b.half.y;
        if(minY < 0){
          b.position.y = b.half.y;
          if(b.velocity.y < 0) b.velocity.y = -b.velocity.y * (b.restitution || 0.2);
          b.velocity.x *= 0.9; b.velocity.z *= 0.9;
        }
      }
    }

    // 구-구 간 충돌
    for(let i=0;i<world.length;i++){
      for(let j=i+1;j<world.length;j++){
        const a = world[i], b = world[j];
        if(a.shape === 'sphere' && b.shape === 'sphere') handleSphereSphere(a,b);
        if(a.shape === 'sphere' && b.shape === 'box') handleSphereBox(a,b);
        if(a.shape === 'box' && b.shape === 'sphere') handleSphereBox(b,a);
        // box-box 충돌은 생략(복잡함)
      }
    }
  }

  function handleSphereSphere(a,b){
    const diff = new THREE.Vector3().subVectors(b.position, a.position);
    const dist = diff.length();
    const r = a.radius + b.radius;
    if(dist === 0) return;
    if(dist < r){
      const n = diff.multiplyScalar(1/dist);
      const penetration = r - dist;
      // 분리
      const totalInvMass = a.invMass + b.invMass;
      if(totalInvMass === 0) return;
      a.position.addScaledVector(n, -penetration * (a.invMass/totalInvMass));
      b.position.addScaledVector(n, penetration * (b.invMass/totalInvMass));

      // 충돌 충격(impulse)
      const relVel = new THREE.Vector3().subVectors(b.velocity, a.velocity);
      const velAlongN = relVel.dot(n);
      if(velAlongN > 0) return; // 벌어지는 중
      const e = Math.min(a.restitution||0.4, b.restitution||0.4);
      const j = -(1 + e) * velAlongN / totalInvMass;
      const impulse = n.clone().multiplyScalar(j);
      if(a.invMass !== 0) a.velocity.addScaledVector(impulse, -a.invMass);
      if(b.invMass !== 0) b.velocity.addScaledVector(impulse, b.invMass);
    }
  }

  function handleSphereBox(s, box){
    // sphere vs AABB collision resolution
    const clamped = new THREE.Vector3(
      Math.max(box.position.x - box.half.x, Math.min(s.position.x, box.position.x + box.half.x)),
      Math.max(box.position.y - box.half.y, Math.min(s.position.y, box.position.y + box.half.y)),
      Math.max(box.position.z - box.half.z, Math.min(s.position.z, box.position.z + box.half.z))
    );
    const diff = new THREE.Vector3().subVectors(s.position, clamped);
    const dist2 = diff.lengthSq();
    if(dist2 <= s.radius * s.radius){
      const dist = Math.sqrt(Math.max(1e-6, dist2));
      const n = diff.clone().divideScalar(dist);
      const penetration = s.radius - dist;
      const totalInv = s.invMass + box.invMass;
      if(totalInv === 0) return;
      s.position.addScaledVector(n, penetration * (s.invMass/totalInv));
      box.position.addScaledVector(n, -penetration * (box.invMass/totalInv));
      // impulse
      const relVel = new THREE.Vector3().subVectors(s.velocity, box.velocity);
      const velAlongN = relVel.dot(n);
      if(velAlongN > 0) return;
      const e = Math.min(s.restitution||0.4, box.restitution||0.2);
      const j = -(1+e)*velAlongN / totalInv;
      const impulse = n.clone().multiplyScalar(j);
      if(s.invMass!==0) s.velocity.addScaledVector(impulse, s.invMass);
      if(box.invMass!==0) box.velocity.addScaledVector(impulse, -box.invMass);
    }
  }

  // API
  return {
    get gravity(){ return gravity.y },
    setGravity(y){ setGravity(y) },
    addBody(b){ world.push(b); },
    removeBody(b){ const i=world.indexOf(b); if(i>=0) world.splice(i,1); },
    step(delta){ step(delta) },
    bodies(){ return world.slice(); }
  };
})();
