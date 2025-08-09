// 간단한 풀(Three.js Mesh 생성과 재사용)을 제공합니다.
window.ObjectPool = (function(){
  const sphereGeom = new THREE.SphereGeometry(0.5, 16, 12);
  const boxGeom = new THREE.BoxGeometry(1,1,1);
  const mats = {
    red: new THREE.MeshStandardMaterial({color:0xcc4444}),
    blue: new THREE.MeshStandardMaterial({color:0x4466cc}),
    gray: new THREE.MeshStandardMaterial({color:0x999999})
  };
  const pool = [];
  function createSphereMesh(){ return new THREE.Mesh(sphereGeom, mats.red); }
  function createBoxMesh(){ return new THREE.Mesh(boxGeom, mats.blue); }
  return {
    createSphereMesh, createBoxMesh
  };
})();