// DOM이 완전히 로드된 후 실행되도록 수정
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  
  // 갤러리 요소 확인
  const gallery = document.getElementById('galleryCenter') || document.querySelector('.gallery-center');
  console.log('Gallery element:', gallery);
  
  if (!gallery) {
    console.error('Gallery element not found!');
    return;
  }

  // 타이핑 효과를 위한 초기 화면 설정
  const initialScreen = document.createElement('div');
  initialScreen.className = 'initial-screen';
  initialScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    font-family: 'Special Elite', cursive;
    font-size: 1.2rem;
    color: black;
  `;
  document.body.appendChild(initialScreen);
  console.log('Initial screen created');

  // 갤러리 초기 상태 설정
  gallery.style.opacity = '0';
  gallery.style.transition = 'opacity 1s ease-in-out';
  console.log('Gallery opacity set to 0');

  const images = gallery.querySelectorAll('img');
  console.log('Found images:', images.length);
  
  const detailPanel = document.getElementById('galleryDetail');
  const detailTitle = document.getElementById('detailTitle');
  const detailText = document.getElementById('detailText');

  let currentOpen = null;

  // 타이핑 효과 함수
  function typeWriter(element, text, speed = 80) {
    console.log('Starting typewriter effect');
    let i = 0;
    element.textContent = '';
    
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        console.log('Typewriter effect completed');
        // 타이핑이 끝나면 1초 후에 초기 화면을 숨기고 갤러리를 보여줌
        setTimeout(() => {
          console.log('Fading out initial screen');
          initialScreen.style.opacity = '0';
          initialScreen.style.transition = 'opacity 1s ease-in-out';
          gallery.style.opacity = '1';
          
          // 초기 화면 완전히 사라진 후 DOM에서 제거
          setTimeout(() => {
            console.log('Removing initial screen');
            initialScreen.remove();
          }, 1000);
        }, 1000);
      }
    }
    
    type();
  }

  // 타이핑 효과 시작
  console.log('Starting typewriter effect with text');
  typeWriter(initialScreen, 'Is this a message, or is it a crime?');

  // 툴팁 생성
  let tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  document.body.appendChild(tooltip);

  // 배경 이미지 컨테이너 생성
  let bgContainer = document.createElement('div');
  bgContainer.className = 'background-images';
  document.body.appendChild(bgContainer);

  // 갤러리 배경 컨테이너 참조
  const galleryBg = document.querySelector('.gallery-background');

  images.forEach(img => {
    img.addEventListener('click', function() {
      // 같은 이미지를 다시 클릭하면 닫기
      if (currentOpen === img) {
        detailPanel.style.display = 'none';
        currentOpen = null;
        bgContainer.innerHTML = ''; // 기존 배경 이미지 제거
        // 갤러리 배경 이미지 숨기기
        const activeBg = galleryBg.querySelector('img.active');
        if (activeBg) {
          activeBg.classList.remove('active');
        }
        return;
      }

      // 새 이미지 클릭 시 내용 갱신
      detailTitle.textContent = img.getAttribute('data-title');
      detailText.innerHTML = img.getAttribute('data-description');
      
      // 영상 링크가 있으면 iframe 추가
      if (img.getAttribute('data-video')) {
        const videoUrl = img.getAttribute('data-video');
        detailText.innerHTML += `
          <div class="video-container">
            <iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      }

      detailPanel.style.display = 'flex';
      currentOpen = img;

      // 갤러리 이미지를 배경으로 설정
      galleryBg.innerHTML = '';
      const bgImg = document.createElement('img');
      bgImg.src = img.getAttribute('data-cover-image') || img.src;  // data-cover-image가 있으면 그 이미지를, 없으면 클릭한 이미지를 사용
      galleryBg.appendChild(bgImg);
      // 약간의 지연 후 active 클래스 추가 (트랜지션 효과를 위해)
      setTimeout(() => bgImg.classList.add('active'), 50);

      // 기존 배경 이미지 표시 (이 부분은 그대로 유지)
      bgContainer.innerHTML = '';
      const bgImages = JSON.parse(img.getAttribute('data-background-images') || '[]');
    
      const imgRect = img.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const imgTop = imgRect.top + scrollTop;
      const windowHeight = window.innerHeight;
      
      const imageHeight = 150;
      const imageWidth = 230;
      const padding = 12;
      const numImages = bgImages.length;
      const offset = 10;

      const startLeft = 20 + offset;
      const top = imgTop + 100;

      const positions = bgImages.map((_, index) => {
        return {
          top: top + Math.random() * 10 - 5,
          left: startLeft + (imageWidth + padding) * index
        };
      });

      bgImages.forEach((src, index) => {
        const bgImg = document.createElement('img');
        bgImg.src = src;
        const { top, left } = positions[index];
        bgImg.style.position = 'absolute';
        bgImg.style.left = left + 'px';
        bgImg.style.top = top + 'px';
        bgImg.style.zIndex = '1';
        bgImg.style.border = 'none';
        bgImg.style.outline = 'none';
        // 랜덤 회전 추가 (-3 ~ +3도)
        const rotate = (Math.random() * 6 - 3).toFixed(2); // -3 ~ +3
        bgImg.style.transform = `rotate(${rotate}deg)`;
        bgContainer.appendChild(bgImg);
      });
    });

    img.addEventListener('mouseenter', e => {
      const text = img.getAttribute('data-title') || img.getAttribute('alt') || '';
      tooltip.textContent = text;
      tooltip.classList.add('visible');
    });
    img.addEventListener('mousemove', e => {
      tooltip.style.left = (e.clientX + 16) + 'px';
      tooltip.style.top = (e.clientY + 8) + 'px';
    });
    img.addEventListener('mouseleave', e => {
      tooltip.classList.remove('visible');
    });
  });

  // 갤러리 이미지 호버 시 자동 스크롤
  document.querySelectorAll('.gallery-center img').forEach(img => {
    img.addEventListener('mouseenter', () => {
      img.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // localStorage 초기화
  localStorage.removeItem('modalClosed');

  // 스크롤 감지 및 모달 표시
  window.addEventListener('scroll', function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      // localStorage에서 모달 표시 여부 확인
      if (!localStorage.getItem('modalClosed')) {
        document.getElementById('experienceModal').style.display = 'flex';
      }
    }
  });
});




