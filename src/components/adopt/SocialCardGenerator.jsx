import { useRef, useEffect } from 'react';

export default function SocialCardGenerator({ pet, canvasRef }) {
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const drawCard = (img) => {
      // Background
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, width, height);

      // Draw image at top
      if (img) {
        const imgHeight = 710;
        const scale = Math.max(width / img.width, imgHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (imgHeight - scaledHeight) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, imgHeight);
        ctx.clip();
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        ctx.restore();
      }

      // Info section
      let currentY = 780;
      const lineGap = 60;

      // Pet name
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pet.name || 'Meet Me!', width / 2, currentY);
      currentY += lineGap + 30;

      // Details line
      const details = [pet.species, pet.age, pet.breed].filter(Boolean).join(' · ');
      if (details) {
        ctx.fillStyle = '#555';
        ctx.font = '38px Arial';
        ctx.fillText(details, width / 2, currentY);
        currentY += lineGap;
      }

      // Bio/description
      if (pet.bio || pet.description) {
        const bioText = pet.bio || pet.description;
        ctx.fillStyle = '#555';
        ctx.font = 'italic 30px Arial';
        const maxWidth = width - 120;
        const words = bioText.split(' ');
        let line = '';
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth) {
            ctx.fillText(line, width / 2, currentY);
            currentY += 40;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) { ctx.fillText(line, width / 2, currentY); currentY += 40; }
        currentY += 20;
      }

      // Location
      if (pet.location) {
        ctx.fillStyle = '#888';
        ctx.font = '32px Arial';
        ctx.fillText(`📍 ${pet.location}`, width / 2, currentY);
        currentY += lineGap;
      }

      // Shelter/source
      if (pet.source) {
        ctx.fillStyle = '#666';
        ctx.font = 'italic 30px Arial';
        ctx.fillText(`🏠 ${pet.source}`, width / 2, currentY);
        currentY += lineGap;
      }

      // Health/status badges
      const badges = [];
      if (pet.vaccinated) badges.push('✅ Vaccinated');
      if (pet.spayed_neutered) badges.push('✅ Spayed/Neutered');
      if (pet.dewormed) badges.push('✅ Dewormed');
      if (pet.urgent) badges.push('🚨 Urgent');
      if (pet.transfer_needed) badges.push('🚚 Transfer Needed');
      if (pet.rescue_needed) badges.push('🆘 Rescue Needed');

      if (badges.length > 0) {
        currentY += 10;
        ctx.fillStyle = '#444';
        ctx.font = '28px Arial';
        for (let i = 0; i < badges.length; i += 2) {
          const row = badges.slice(i, i + 2).join('   ');
          ctx.fillText(row, width / 2, currentY);
          currentY += 44;
        }
      }

      // Friendliness
      const friendly = [];
      if (pet.kid_friendly === 'yes') friendly.push('👧 Kid Friendly');
      if (pet.dog_friendly === 'yes') friendly.push('🐕 Dog Friendly');
      if (pet.cat_friendly === 'yes') friendly.push('🐈 Cat Friendly');
      if (friendly.length > 0) {
        ctx.fillStyle = '#555';
        ctx.font = '28px Arial';
        ctx.fillText(friendly.join('   '), width / 2, currentY);
        currentY += lineGap;
      }

      // CTA
      ctx.fillStyle = '#708238';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('Rescue. Adopt. Save a Life.', width / 2, height - 80);

      // Hashtag
      ctx.fillStyle = '#aaa';
      ctx.font = '28px Arial';
      ctx.fillText('#AdoptDontShop', width / 2, height - 30);
    };

    if (pet.photo_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawCard(img);
      img.onerror = () => drawCard(null);
      img.src = pet.photo_url;
    } else {
      drawCard(null);
    }
  }, [pet, canvasRef]);

  return null;
}