export function faceLabel(face: string) {
  if (face.startsWith('dot-'))
    return `${face.split('-')[1]} cercle${face === 'dot-1' ? '' : 's'}`;
  if (face.startsWith('bamboo-'))
    return `${face.split('-')[1]} bambou${face === 'bamboo-1' ? '' : 's'}`;
  if (face.startsWith('character-'))
    return `${face.split('-')[1]} caractère${face === 'character-1' ? '' : 's'}`;
  return (
    (
      {
        east: 'Vent de l’Est',
        south: 'Vent du Sud',
        west: 'Vent de l’Ouest',
        north: 'Vent du Nord',
        red: 'Dragon rouge',
        green: 'Dragon vert',
        white: 'Dragon blanc',
        'flower-plum': 'Fleur de prunier',
        'flower-orchid': 'Fleur d’orchidée',
        'flower-chrysanthemum': 'Fleur de chrysanthème',
        'flower-bamboo': 'Fleur de bambou',
        'season-spring': 'Printemps',
        'season-summer': 'Été',
        'season-autumn': 'Automne',
        'season-winter': 'Hiver',
      } as Record<string, string>
    )[face] ?? face
  );
}
const coords: Record<number, number[][]> = {
  1: [[32, 43]],
  2: [
    [32, 26],
    [32, 60],
  ],
  3: [
    [19, 24],
    [32, 43],
    [45, 62],
  ],
  4: [
    [20, 27],
    [44, 27],
    [20, 59],
    [44, 59],
  ],
  5: [
    [18, 23],
    [46, 23],
    [32, 43],
    [18, 63],
    [46, 63],
  ],
  6: [
    [20, 23],
    [44, 23],
    [20, 43],
    [44, 43],
    [20, 63],
    [44, 63],
  ],
  7: [
    [20, 15],
    [44, 15],
    [20, 36],
    [44, 36],
    [20, 57],
    [44, 57],
    [32, 73],
  ],
  8: [
    [20, 14],
    [44, 14],
    [20, 33],
    [44, 33],
    [20, 52],
    [44, 52],
    [20, 71],
    [44, 71],
  ],
  9: [
    [15, 19],
    [32, 19],
    [49, 19],
    [15, 43],
    [32, 43],
    [49, 43],
    [15, 67],
    [32, 67],
    [49, 67],
  ],
};

const bambooCoords: Record<number, number[][]> = {
  ...coords,
  7: [
    [20, 18],
    [44, 18],
    [20, 38],
    [44, 38],
    [20, 58],
    [44, 58],
    [32, 70],
  ],
  8: [
    [20, 13],
    [44, 13],
    [20, 33],
    [44, 33],
    [20, 53],
    [44, 53],
    [20, 73],
    [44, 73],
  ],
  9: [
    [17, 21],
    [32, 21],
    [47, 21],
    [17, 43],
    [32, 43],
    [47, 43],
    [17, 65],
    [32, 65],
    [47, 65],
  ],
};
const CHINESE_NUMERALS = [
  '',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
];
const HONORS: Record<string, { symbol: string; kind: string; color: string }> =
  {
    east: { symbol: '東', kind: '風', color: '#254d66' },
    south: { symbol: '南', kind: '風', color: '#254d66' },
    west: { symbol: '西', kind: '風', color: '#254d66' },
    north: { symbol: '北', kind: '風', color: '#254d66' },
    red: { symbol: '中', kind: '龍', color: '#af4035' },
    green: { symbol: '發', kind: '龍', color: '#276b50' },
  };
const BONUS_TILES: Record<
  string,
  { symbol: string; kind: string; color: string }
> = {
  'flower-plum': { symbol: '梅', kind: '花', color: '#a83c57' },
  'flower-orchid': { symbol: '蘭', kind: '花', color: '#7c4c99' },
  'flower-chrysanthemum': { symbol: '菊', kind: '花', color: '#b27624' },
  'flower-bamboo': { symbol: '竹', kind: '花', color: '#337254' },
  'season-spring': { symbol: '春', kind: '季', color: '#3f7b52' },
  'season-summer': { symbol: '夏', kind: '季', color: '#b34832' },
  'season-autumn': { symbol: '秋', kind: '季', color: '#a46d24' },
  'season-winter': { symbol: '冬', kind: '季', color: '#356b8a' },
};
const CHINESE_FONT = "'Songti SC', 'STSong', 'Noto Serif CJK SC', serif";
export function TileFace({ face }: { face: string }) {
  const number = Number(face.split('-')[1]);
  const honor = HONORS[face];
  const bonus = BONUS_TILES[face];
  const color =
    number % 3 === 0 ? '#a8473c' : number % 2 === 0 ? '#245b85' : '#236653';
  const dotRadius = number >= 7 ? 6.7 : number === 1 ? 16 : 8;
  const dotInnerRadius = number >= 7 ? 3.7 : number === 1 ? 11 : 4.5;
  return (
    <svg viewBox="0 0 64 86" className="tile-face" aria-hidden="true">
      <path
        d="M7 12V7h5M52 7h5v5M7 74v5h5M52 79h5v-5"
        fill="none"
        stroke="#c4b18b"
        strokeWidth=".75"
        opacity=".8"
      />
      {face.startsWith('dot-') &&
        coords[number].map(([x, y], i) => (
          <g key={i} fill="none" stroke={color}>
            <circle cx={x} cy={y} r={dotRadius} strokeWidth="2.5" />
            <circle cx={x} cy={y} r={dotInnerRadius} strokeWidth="1" />
            <circle cx={x} cy={y} r="1.8" fill={color} />
            {number === 1 && (
              <path
                d="M32 30v26M19 43h26M23 34l18 18M23 52l18-18"
                strokeWidth="1"
              />
            )}
          </g>
        ))}
      {face.startsWith('bamboo-') &&
        bambooCoords[number].map(([x, y], i) => (
          <g
            key={i}
            stroke={i === 2 ? '#a8473c' : '#236653'}
            strokeLinecap="round"
          >
            <path
              d={`M${x - 2} ${y - 8}v16M${x + 2} ${y - 8}v16`}
              strokeWidth="2.2"
            />
            <path
              d={`M${x - 4} ${y - 6}h8M${x - 4} ${y}h8M${x - 4} ${y + 6}h8`}
              strokeWidth="2"
            />
          </g>
        ))}
      {face.startsWith('character-') && (
        <>
          <text
            x="32"
            y="43"
            textAnchor="middle"
            fill="#263f5a"
            fontSize="29"
            fontFamily={CHINESE_FONT}
            fontWeight="600"
          >
            {CHINESE_NUMERALS[number]}
          </text>
          <text
            x="32"
            y="70"
            textAnchor="middle"
            fill="#af4035"
            fontSize="25"
            fontFamily={CHINESE_FONT}
            fontWeight="600"
          >
            萬
          </text>
        </>
      )}
      {honor && (
        <>
          <text
            x="32"
            y="55"
            textAnchor="middle"
            fill={honor.color}
            fontSize="36"
            fontFamily={CHINESE_FONT}
            fontWeight="600"
          >
            {honor.symbol}
          </text>
          <text
            x="32"
            y="72"
            textAnchor="middle"
            fill="#77715c"
            fontSize="9"
            fontFamily={CHINESE_FONT}
          >
            {honor.kind}
          </text>
        </>
      )}
      {face === 'white' && (
        <>
          <rect
            x="16"
            y="21"
            width="32"
            height="43"
            rx="3"
            fill="none"
            stroke="#245b85"
            strokeWidth="3"
          />
          <rect
            x="21"
            y="26"
            width="22"
            height="33"
            rx="1"
            fill="none"
            stroke="#245b85"
            strokeWidth="1"
          />
          <text
            x="32"
            y="76"
            textAnchor="middle"
            fill="#245b85"
            fontSize="8"
            fontFamily={CHINESE_FONT}
          >
            白
          </text>
        </>
      )}
      {bonus && (
        <>
          <path
            d="M15 64Q25 54 32 63Q39 54 49 64"
            fill="none"
            stroke={bonus.color}
            strokeWidth="1.4"
            opacity=".65"
          />
          <text
            x="32"
            y="53"
            textAnchor="middle"
            fill={bonus.color}
            fontSize="34"
            fontFamily={CHINESE_FONT}
            fontWeight="600"
          >
            {bonus.symbol}
          </text>
          <text
            x="32"
            y="74"
            textAnchor="middle"
            fill="#77715c"
            fontSize="9"
            fontFamily={CHINESE_FONT}
          >
            {bonus.kind}
          </text>
        </>
      )}
    </svg>
  );
}
