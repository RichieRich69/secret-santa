import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, inject } from "@angular/core";
import * as THREE from "three";

@Component({
  selector: "app-background",
  standalone: true,
  template: ` <div #rendererContainer class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none bg-gradient-to-b from-slate-900 to-slate-800"></div> `,
  styles: [],
})
export class BackgroundComponent implements OnInit, OnDestroy {
  @ViewChild("rendererContainer", { static: true }) rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number | null = null;
  private ngZone = inject(NgZone);

  ngOnInit() {
    this.initThree();
    this.animate();
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    // Cleanup Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      if (Array.isArray(this.particles.material)) {
        this.particles.material.forEach((m) => m.dispose());
      } else {
        this.particles.material.dispose();
      }
    }
  }

  private initThree() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    // Optional: Add some fog for depth
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
    this.camera.position.z = 1000;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Particles (Snow)
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000);

      // Random velocity for each particle
      velocities.push(
        (Math.random() - 0.5) * 0.5, // x
        -(Math.random() * 2 + 1), // y (falling down)
        (Math.random() - 0.5) * 0.5 // z
      );
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.Float32BufferAttribute(velocities, 3));

    // Create a circular texture for soft snowflakes
    const sprite = this.createSnowflakeTexture();

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4,
      map: sprite,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createSnowflakeTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);
        this.render();
      };
      loop();
    });
  }

  private render() {
    const positions = this.particles.geometry.attributes["position"].array as Float32Array;
    const velocities = this.particles.geometry.attributes["velocity"].array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // Update positions based on velocity
      positions[i] += velocities[i]; // x
      positions[i + 1] += velocities[i + 1]; // y
      positions[i + 2] += velocities[i + 2]; // z

      // Reset if out of bounds
      if (positions[i + 1] < -1000) {
        positions[i + 1] = 1000;
        positions[i] = Math.random() * 2000 - 1000;
        positions[i + 2] = Math.random() * 2000 - 1000;
      }
    }

    this.particles.geometry.attributes["position"].needsUpdate = true;

    // Slowly rotate the whole system
    this.particles.rotation.y += 0.0005;

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
