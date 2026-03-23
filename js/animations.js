/* 
   Next-Gen Animation Engine for Sharir Shilpi
   Uses GSAP for motion and Three.js for background effects.
*/

class AnimationEngine {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    
    this.init();
    this.createMesh();
    this.animate();
    this.setupEventListeners();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.z = 5;
  }

  createMesh() {
    // Liquid Mesh Background
    const geometry = new THREE.PlaneGeometry(20, 10, 64, 64);
    
    // Shader-like material using GSAP for noise-like movement
    this.material = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x1a1a1a,
      specular: 0x818cf8,
      shininess: 100,
      flatShading: false,
      wireframe: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // Lights
    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0x6366f1, 2);
    light2.position.set(-2, -2, 2);
    this.scene.add(light2);

    this.ambientLight = new THREE.AmbientLight(0x0a0a0a, 1);
    this.scene.add(this.ambientLight);
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleMagneticElements(e);
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Intersection Observer for scroll-reveal
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.from(entry.target, {
            y: 40,
            opacity: 0,
            duration: 1,
            ease: "expo.out",
            clearProps: "all"
          });
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Smooth mouse movement
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Distort mesh vertices for liquid effect
    if (this.mesh) {
      const time = Date.now() * 0.001;
      const positions = this.mesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i+1];
        positions[i+2] = Math.sin(x * 0.5 + time) * 0.2 + Math.cos(y * 0.5 + time) * 0.2;
      }
      this.mesh.geometry.attributes.position.needsUpdate = true;
      
      this.mesh.rotation.x = this.mouse.y * 0.1;
      this.mesh.rotation.y = this.mouse.x * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- PREMIUM COMPONENT EFFECTS ---

  handleMagneticElements(e) {
    const magneticElements = document.querySelectorAll('.magnetic');
    magneticElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      
      if (distance < 100) {
        const x = (e.clientX - centerX) * 0.4;
        const y = (e.clientY - centerY) * 0.4;
        gsap.to(el, { x, y, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      }
    });
  }

  initTiltElements() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        gsap.to(card, {
          rotateX,
          rotateY,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.3)"
        });
      });
    });
  }

  updateThemeColors(isDark) {
    if (!this.mesh) return;
    const color = isDark ? 0x6366f1 : 0x4f46e5;
    const emissive = isDark ? 0x000000 : 0x1a1a1a;
    
    gsap.to(this.material.color, {
      r: (color >> 16 & 255) / 255,
      g: (color >> 8 & 255) / 255,
      b: (color & 255) / 255,
      duration: 0.8
    });
    
    gsap.to(this.mesh.rotation, {
      z: isDark ? Math.PI : 0,
      duration: 1.5,
      ease: "expo.inOut"
    });
  }

  pageTransition() {
    const main = document.querySelector('.main-content');
    if (!main) return;

    const tl = gsap.timeline();
    
    // Liquid Morph / Perspective Zoom Effect
    tl.to(main, {
      opacity: 0,
      scale: 0.95,
      rotateX: 5,
      filter: "blur(10px)",
      duration: 0.4,
      ease: "power2.in"
    })
    .set(main, { 
      rotateX: -5,
      scale: 1.05 
    })
    .to(main, {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "expo.out",
      clearProps: "filter,transform"
    });
  }
}

// Global instance
window.animations = new AnimationEngine();

// Refresh animations when content changes
window.addEventListener('ss-content-updated', () => {
  window.animations.initTiltElements();
  // Observe new elements
  document.querySelectorAll('.screen section, .card').forEach(el => {
    window.animations.observer.observe(el);
  });
});
