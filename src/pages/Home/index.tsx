import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import AudioInput from "./AudioInput";

const Home = () => {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [pause, setPause] = useState<boolean>(false);
    const [input, setInput] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const uploadedObjectUrlRef = useRef<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // 初始化全局 AudioContext（仅一次），组件卸载时销毁
    useEffect(() => {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (!containerRef.current) return;

      // 初始化Three.js场景
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 11;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      // 初始化渲染尺寸与像素比，使用容器尺寸更精确
      if (containerRef.current) {
        const initialWidth = containerRef.current.clientWidth;
        const initialHeight = containerRef.current.clientHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(initialWidth, initialHeight);
        camera.aspect = initialWidth / initialHeight;
        camera.updateProjectionMatrix();
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      renderer.setClearColor(0x000);
      containerRef.current.appendChild(renderer.domElement);

      // 监听窗口尺寸变化，更新相机与渲染器
      const handleResize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      };
      window.addEventListener("resize", handleResize);

      // 创建粒子系统
      const particleCount = 18000;
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      // 初始化粒子位置和大小
      const radius = 24;
      for (let i = 0; i < particleCount; i++) {
        const angle = i * (1 / 180) * Math.PI * 2;
        const distance = Math.ceil(i / 180) * 0.005 * radius;

        positions[i * 3] = Math.cos(angle) * distance;
        positions[i * 3 + 1] = -4;
        positions[i * 3 + 2] = Math.sin(angle) * distance;

        sizes[i] = 2 * (1 - distance / radius);
      }

      particles.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const particleMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.05,
        sizeAttenuation: true,
      });

      const particleSystem = new THREE.Points(particles, particleMaterial);
      scene.add(particleSystem);

      // 音频分析（使用全局 AudioContext）
      const ctx =
        audioContextRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContextRef.current) {
        audioContextRef.current = ctx;
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 加载音频
      if (audioUrl) {
        const audioElement = new Audio(audioUrl);
        audioElement.loop = true;
        audioElementRef.current = audioElement;
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        // 若上下文被限制，先尝试恢复
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        if (!pause) {
          const playPromise = audioElement.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              // 如果自动播放被阻止，后续任意点击会触发播放
            });
          }
        }
      }

      // 动画循环
      const animate = () => {
        if (!pause) {
          animationFrameRef.current = requestAnimationFrame(animate);

          // 只在音频播放时更新粒子
          if (audioElementRef.current && !audioElementRef.current.paused) {
            analyser.getByteFrequencyData(dataArray);

            const positions = particles.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
              const angle = i * (1 / 180) * Math.PI * 2;
              const distance = Math.ceil(i / 180) * 0.005 * radius;
              const audioValue = dataArray[Math.ceil(i / 180)] / 360;

              positions[i * 3] = Math.cos(angle) * distance;
              positions[i * 3 + 1] = -4 + audioValue;
              positions[i * 3 + 2] = Math.sin(angle) * distance;

              sizes[i] = 2 * (1 - distance / radius);
            }

            particles.attributes.position.needsUpdate = true;
            particles.attributes.size.needsUpdate = true;
          }

          renderer.render(scene, camera);
        }
      };

      animate();

      // 清理函数
      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }
        renderer.dispose();
        containerRef.current &&
          containerRef.current.removeChild(renderer.domElement);
        if (uploadedObjectUrlRef.current) {
          URL.revokeObjectURL(uploadedObjectUrlRef.current);
          uploadedObjectUrlRef.current = null;
        }
      };
    }, [audioUrl]);

    // 处理音乐播放/暂停
    const handlePlayPause = () => {
      if (audioElementRef.current) {
        if (pause) {
          audioElementRef.current.play();
        } else {
          audioElementRef.current.pause();
        }
        setPause(!pause);
      }
    };

    const musicList = [
      { id: "1", name: "稻香", author: "周杰伦", src: "./music/daoxiang.mp3" },
      { id: "2", name: "黑夜", author: "陈粒", src: "./music/heiye.mp3" },
      { id: "3", name: "小半", author: "陈粒", src: "./music/xiaoban.mp3" },
      {
        id: "4",
        name: "给电影人的情书",
        author: "蔡琴",
        src: "./music/geidianyingrendeqingshu.mp3",
      },
    ];
    const [curMusic, setCurMusic] = useState("");
    useEffect(() => {
      if (!curMusic) return;
      const curMusicSrc = musicList?.filter((i) => i.id === curMusic)[0].src;
      if (curMusicSrc) {
        setAudioUrl(curMusicSrc);
      }
    }, [curMusic]);
    return (
      <div
        style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
        onClick={() => handlePlayPause()}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            fontSize: "12px",
            fontWeight: "400",
          }}
        >
          {musicList?.map((item) => (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                // 切换到内置音乐：清空输入框，取消上传URL，确保自动播放
                setInput("");
                setPause(false);
                audioContextRef.current?.resume().catch(() => {});
                if (uploadedObjectUrlRef.current) {
                  URL.revokeObjectURL(uploadedObjectUrlRef.current);
                  uploadedObjectUrlRef.current = null;
                }
                setCurMusic(item.id);
              }}
              style={{
                padding: "16px 0",
                cursor: "pointer",
                color: curMusic === item.id ? "white" : "gray",
              }}
            >
              {item.name} - {item.author}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        >
          <AudioInput
            input={input}
            onInputChange={(e) => {
              setInput(e.target.value);
            }}
            onSubmit={(url) => {
              // 输入加载：取消内置选中并自动播放
              setCurMusic("");
              setPause(false);
              audioContextRef.current?.resume().catch(() => {});
              setAudioUrl(url);
            }}
            onUpload={(e) => {
              const file = e.currentTarget.files && e.currentTarget.files[0];
              if (!file) return;
              if (uploadedObjectUrlRef.current) {
                URL.revokeObjectURL(uploadedObjectUrlRef.current);
                uploadedObjectUrlRef.current = null;
              }
              const objectUrl = URL.createObjectURL(file);
              uploadedObjectUrlRef.current = objectUrl;
              // 上传加载：取消内置选中并自动播放
              setCurMusic("");
              setPause(false);
              audioContextRef.current?.resume().catch(() => {});
              setAudioUrl(objectUrl);
            }}
          />
        </div>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    );
};

export default Home;