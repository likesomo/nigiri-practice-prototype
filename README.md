# 니기리 수련 — 리듬 손동작 프로토타입

초밥 장인의 두 손을 박자로 움직이는 리듬 요리 미니게임 프로토타입입니다.
박마다 키 하나를 눌러 밥을 뜨고, 굴리고, 누르고, 놓아 초밥 한 점을 쥡니다.

- **3D판**: [index.html](https://likesomo.github.io/nigiri-practice-prototype/)
- **2D판**: [index2d.html](https://likesomo.github.io/nigiri-practice-prototype/index2d.html)

## 조작

| 키 | 동작 |
|---|---|
| A · D · W · S | 박에 맞춰 손동작(뜨기 · 굴리기 · 와사비 · 누르기 · 뒤집기 · 조이기 · 적시기 · 덜기) |
| A + D | 두 손 함께 누르기 |
| 클릭 | 8박 마지막에 접시에 놓기 |
| Space / Enter | 시작 · 결정 |
| Esc | 일시정지 |

PC 데스크톱 브라우저(Chrome 권장), 1920×1080 기준입니다. 소리를 켜고 플레이하세요.

## 구성

- 단일 HTML 파일 두 개로 동작합니다. 외부 의존성은 three.js(r128, cdnjs) 하나입니다.
- 2D와 3D는 같은 규칙 코어를 쓰고, 화면만 다릅니다.

## 크레딧

- 3D 손 모델: CGTrader 「Realistic human hand model」 — https://www.cgtrader.com/items/3670422
- 3D 렌더링: [three.js](https://threejs.org/) (MIT)

기획 · 구현: 엄소윤
