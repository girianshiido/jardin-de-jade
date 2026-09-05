export function faceLabel(face: string) {
  if (face.startsWith('dot-'))
    return `${face.split('-')[1]} cercle${face === 'dot-1' ? '' : 's'}`;
  if (face.startsWith('bamboo-'))
    return `${face.split('-')[1]} bambou${face === 'bamboo-1' ? '' : 's'}`;
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
};
export function TileFace({ face }: { face: string }) {
  const number = Number(face.split('-')[1]);
  const color =
    number % 3 === 0 ? '#a8473c' : number % 2 === 0 ? '#245b85' : '#236653';
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
            <circle cx={x} cy={y} r={number === 1 ? 16 : 8} strokeWidth="2.5" />
            <circle cx={x} cy={y} r={number === 1 ? 11 : 4.5} strokeWidth="1" />
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
        coords[number].map(([x, y], i) => (
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
      {!number && face !== 'white' && (
        <>
          <text
            x="32"
            y="55"
            textAnchor="middle"
            fill={
              face === 'red'
                ? '#af4035'
                : face === 'green'
                  ? '#276b50'
                  : '#254d66'
            }
            fontSize="36"
            fontFamily="serif"
            fontWeight="600"
          >
            {
              (
                {
                  east: '東',
                  south: '南',
                  west: '西',
                  north: '北',
                  red: '中',
                  green: '發',
                } as Record<string, string>
              )[face]
            }
          </text>
          <text
            x="32"
            y="71"
            textAnchor="middle"
            fill="#77715c"
            fontSize="7"
            letterSpacing="2"
          >
            {
              (
                {
                  east: 'EST',
                  south: 'SUD',
                  west: 'OUEST',
                  north: 'NORD',
                  red: 'DRAGON',
                  green: 'DRAGON',
                } as Record<string, string>
              )[face]
            }
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
        </>
      )}
    </svg>
  );
}
