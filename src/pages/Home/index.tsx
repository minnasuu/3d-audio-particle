//@ts-nocheck
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios"; // 导入axios

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
  { id: "5", name: "雨天", author: "孙燕姿", src: "./music/yutian.mp3" },
  {
    id: "6",
    name: "AngelLove",
    author: "黄明昊",
    src: "./music/AngelLove.mp3",
  },
  {
    id: "7",
    name: "桜+OK绷",
    author: "麦吉_Maggie",
    src: "./music/桜+OK绷.mp3",
  },
];
const AudioParticleVisualizer = () => {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [pause, setPause] = useState<boolean>(false);
  // const [input, setInput] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<string>("");

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000);
    containerRef.current.appendChild(renderer.domElement);

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

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.01,
      sizeAttenuation: true,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // 音频分析
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // 加载音频
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioElement.loop = true;

      // 添加错误处理，当音频无法加载时显示提示
      audioElement.addEventListener("error", () => {
        setAlertMsg("未找到音频");
        setLoading(false); // 加载失败时关闭加载状态

        // 2秒后自动隐藏提示
        setTimeout(() => {
          setAlertMsg("");
        }, 1000);
      });

      // 添加加载成功处理，清除错误信息
      audioElement.addEventListener("loadeddata", () => {
        setAlertMsg("");
      });

      // 添加播放开始事件监听器，当音频开始播放时关闭loading状态
      audioElement.addEventListener("playing", () => {
        setLoading(false);
      });

      audioElementRef.current = audioElement;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      if (!pause) {
        audioElement.play();
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      audioContext.close();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
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

  const [curMusic, setCurMusic] = useState("");
  useEffect(() => {
    const curMusicSrc = musicList?.filter((i) => i.id === curMusic)[0]?.src;
    if (curMusicSrc) {
      setAudioUrl(curMusicSrc);
    }
  }, [curMusic, musicList]); // 添加musicList作为依赖

  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadAudioName, setUploadAudioName] = useState<string>("");
  const [drag, setDrag] = useState<boolean>(false);
  const handleChange = (e: any, file: any) => {
    setUploadLoading(true);
    e.preventDefault();
    if (file) {
      setLoading(true);
      setCurMusic("");
      setUploadAudioName(file.name);
      let reader = new FileReader();
      reader.readAsDataURL(file);
      setAudioUrl(URL.createObjectURL(file));
      setUploadLoading(false);
      setDrag(false);
    }
  };

  useEffect(() => console.log(loading), [loading]);
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          fontSize: "12px",
          top: 24,
          left: 24,
          zIndex: 10,
        }}
      >
        {musicList?.map((item) => (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              setCurMusic(item.id);
              setLoading(true);
            }}
            style={{
              color: curMusic === item.id ? "white" : "gray",
              padding: "4px 0",
              cursor: "pointer",
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
        onClick={() => handlePlayPause()}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "gray",
            fontSize: "12px",
            whiteSpace: "nowrap",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label
            className="file-input"
            onDragOver={(e: React.DragEvent<HTMLLabelElement>) => {
              setDrag(true);
              e.preventDefault();
            }}
            onDrop={(e: React.DragEvent<HTMLLabelElement>) =>
              handleChange(e, e.dataTransfer.files[0])
            }
            onDragLeave={(e) => {
              e.stopPropagation();
              setDrag(false);
            }}
          >
            {uploadLoading ? (
              "上传中"
            ) : (
              <>
                {drag ? (
                  <>释放上传</>
                ) : (
                  <>{uploadAudioName || "点击此处上传音频文件"}</>
                )}
              </>
            )}
            <input
              accept=".mp3"
              type="file"
              onChange={(e) => handleChange(e, e.target.files[0])}
              style={{ backgroundColor: "transparent", border: "none" }}
            ></input>
          </label>
          {/* 或 <input className="text-input" type='text' placeholder={'输入链接'} value={input} onChange={e => { setInput(e.target.value) }} />
        <div className="check-button" onClick={() => {
          if (input && input.includes('.mp3')) {
            setAudioUrl(input);
          }
        }
        }>
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43 11L16.875 37L5 25.1818" stroke="rgba(255,255,255,0.8)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div> 来上传音频*/}
        </div>
      </div>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          加载中...
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "rgba(255,255,255,0.6)",
          opacity: alertMsg ? 1 : 0,
          transition: "opacity 0.2s linear",
        }}
      >
        {alertMsg}
      </div>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default AudioParticleVisualizer;
