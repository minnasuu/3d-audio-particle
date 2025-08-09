import React, { useState } from 'react'

const AudioInput: React.FC<{
    input: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (url: string) => void;
}> = ({ input, onInputChange, onUpload, onSubmit }) => {
    const [uploadAudioName, setUploadAudioName] = useState<string>('');
  return (
    <div
                style={{position:'absolute',top:8,display:'flex',alignItems:'center',color:'gray',fontSize:'12px',whiteSpace:'nowrap',left:'50%',transform:'translateX(-50%)'}}
                onClick={(e)=> e.stopPropagation()}
            >
          <label style={{cursor:'pointer',minWidth:'100px',height:'20px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'transparent',color:'var(--color-text-4)'}}>
          <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                        onUpload(e);
                        setUploadAudioName(e.target.files?.[0]?.name || '');
                    }}
                    style={{ color: 'var(--color-text-4)', width: '0', height: '0', opacity: 0 }}
              />
              {uploadAudioName || '上传音频文件'}
                </label>
                <span style={{marginInline:'8px'}}>或</span>
                <input
                    type="text"
                    placeholder="输入音频链接，如 https://.../audio.mp3"
                    value={input}
                    onChange={onInputChange}
                    onClick={(e)=> e.stopPropagation()}
                    style={{marginInline:'8px',fontSize:'12px',color:'var(--color-text-4)',padding:'4px 8px',width:'320px',background:'transparent',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4}}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const trimmed = input.trim();
                        if (!trimmed) return;
                        onSubmit(trimmed);
                    }}
                    style={{marginLeft:'8px',padding:'4px 8px',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'var(--color-text-4)',borderRadius:4,cursor:'pointer'}}
                >加载</button>
            </div>
  )
}
export default AudioInput;