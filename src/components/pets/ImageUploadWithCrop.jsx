import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

export default function ImageUploadWithCrop({ onImageSelected, currentImageUrl }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentImageUrl || null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      onImageSelected(file);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    onImageSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors text-muted-foreground"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm">Click to upload photo</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {!preview && currentImageUrl && (
        <p className="text-xs text-muted-foreground">Current: <a href={currentImageUrl} target="_blank" rel="noopener noreferrer" className="underline">view</a></p>
      )}
    </div>
  );
}