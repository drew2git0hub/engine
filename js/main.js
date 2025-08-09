// 메인: 씬 설정, 카메라, 간단 UI, 스폰 로직 연결

(function(){
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(8,6,10);
  camera.lookAt(0,1,0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  hemi.position.set(0,50,0); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(10,20,10); dir.castShadow=true; scene.add(dir);

  // 바닥
  const groundGeom = new THREE.PlaneGeometry(100,100);
  const groundMat = new THREE.MeshStandardMaterial({color:0x777777});
  const ground = new THREE.Mesh(groundGeom, groundMat); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  // 장애물(박스 고정)
  const staticBox = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshStandardMaterial({color:0x884422}));
  staticBox.position.set(0,1,0); staticBox.castShadow = true; scene.add(staticBox);

  // 물리 바디 트래킹
  const bodies = [];

  function spawnSphere(){
    const mesh = ObjectPool.createSphereMesh();
    mesh.castShadow = true; scene.add(mesh);
    const body = {
      shape: 'sphere', position: new THREE.Vector3((Math.random()-0.5)*6, 6 + Math.random()*4, (Math.random()-0.5)*6),
      velocity: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()*2)-1, (Math.random()-0.5)*2),
      mass: 1, invMass: 1, radius: 0.5, restitution: 0.5, mesh
    };
    bodies.push(body);
    Physics.addBody(body);
    updateCount();
  }
  function spawnBox(){
    const mesh = ObjectPool.createBoxMesh(); mesh.castShadow = true; scene.add(mesh);
    const body = {
      shape: 'box', position: new THREE.Vector3((Math.random()-0.5)*6, 6 + Math.random()*4, (Math.random()-0.5)*6),
      velocity: new THREE.Vector3((Math.random()-0.5)*1.5, (Math.random()*2)-1, (Math.random()-0.5)*1.5),
      mass: 2, invMass: 1/2, half: new THREE.Vector3(0.5,0.5,0.5), restitution: 0.3, mesh
    };
    bodies.push(body);
    Physics.addBody(body);
    updateCount();
  }

  // 고정된 staticBox 를 물리 바디로 등록 (invMass = 0 -> 고정)
  const staticBody = { shape:'box', position: staticBox.position.clone(), velocity: new THREE.Vector3(), invMass: 0, half: new THREE.Vector3(1,1,1), mesh: staticBox };
  Physics.addBody(staticBody);

  function updateCount(){ document.getElementById('objCount').textContent = Physics.bodies().length }

  document.getElementById('spawnSphere').addEventListener('click', spawnSphere);
  document.getElementById('spawnBox').addEventListener('click', spawnBox);
  document.getElementById('clearAll').addEventListener('click', ()=>{
    for(const b of Physics.bodies()){
      if(b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
    }
    // 재초기화 (가장 간단하게 페이지 리로드 대신 bodies 비우기)
    location.reload();
  });

  // 첫 몇 개 생성
  for(let i=0;i<6;i++) spawnSphere();
  for(let i=0;i<2;i++) spawnBox();

  let last = performance.now();
  function loop(now){
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    Physics.step(delta);

    // mesh와 body 동기화
    for(const b of Physics.bodies()){
      if(b.mesh){
        b.mesh.position.copy(b.position);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 반응형
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
