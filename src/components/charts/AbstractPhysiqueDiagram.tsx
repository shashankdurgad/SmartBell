const MUSCLE_COLORS = {
	chest: '#236bd8',
	back: '#2671e1',
	shoulders: '#2255a1',
	quads: '#2671e1',
	hamstringsGlutes: '#2671e1',
	biceps: '#205ebc',
	base: '#353f4d',
} as const;

function FrontSilhouette() {
	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Front silhouette">
			<circle cx="60" cy="17" r="13" fill={MUSCLE_COLORS.base} />

			<polygon points="12,50 33,50 30,95 17,92" fill={MUSCLE_COLORS.biceps} />
			<polygon points="87,50 108,50 103,92 90,95" fill={MUSCLE_COLORS.biceps} />

			<polygon points="40,178 56,184 56,210 54,237 46,235 40,210" fill={MUSCLE_COLORS.base} />
			<polygon points="80,178 64,184 64,210 66,237 74,235 80,210" fill={MUSCLE_COLORS.base} />

			<circle cx="23" cy="46" r="11" fill={MUSCLE_COLORS.shoulders} />
			<circle cx="97" cy="46" r="11" fill={MUSCLE_COLORS.shoulders} />

            <polygon points="52,31 68,31 86,38 34,38" fill={MUSCLE_COLORS.chest} />
            <polygon points="34,38 86,38 86,54 34,54" fill={MUSCLE_COLORS.chest} />
			<polygon points="34,54 86,54 74,78 46,78" fill={MUSCLE_COLORS.chest} />
			<polygon points="46,78 74,78 72,104 48,104" fill={MUSCLE_COLORS.base} />

			<polygon points="48,104 72,104 62,119 58,119" fill={MUSCLE_COLORS.quads} />
			<polygon points="36,119 48,104 58,119 58,176 56,180 40,174" fill={MUSCLE_COLORS.quads} />
			<polygon points="62,119 72,104 84,119 80,174 64,180 62,176" fill={MUSCLE_COLORS.quads} />
		</svg>
	);
}

function BackSilhouette() {
	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Back silhouette">
			<circle cx="60" cy="20" r="12" fill={MUSCLE_COLORS.base} />

			<polygon points="26,54 38,54 38,100 28,100" fill={MUSCLE_COLORS.base} />
			<polygon points="82,54 94,54 92,100 82,100" fill={MUSCLE_COLORS.base} />
			<polygon points="45,186 54,186 52,242 44,242" fill={MUSCLE_COLORS.base} />
			<polygon points="66,186 75,186 75,242 68,242" fill={MUSCLE_COLORS.base} />

			<circle cx="34" cy="46" r="10" fill={MUSCLE_COLORS.shoulders} />
			<circle cx="86" cy="46" r="10" fill={MUSCLE_COLORS.shoulders} />

			<polygon points="42,56 78,56 70,108 50,108" fill={MUSCLE_COLORS.back} />
			<polygon points="44,112 58,108 64,126 52,136" fill={MUSCLE_COLORS.hamstringsGlutes} />
			<polygon points="76,112 62,108 56,126 68,136" fill={MUSCLE_COLORS.hamstringsGlutes} />
			<polygon points="42,134 58,134 56,180 42,176" fill={MUSCLE_COLORS.hamstringsGlutes} />
			<polygon points="62,134 78,134 78,176 64,180" fill={MUSCLE_COLORS.hamstringsGlutes} />
		</svg>
	);
}

const legendItems = [
	{ label: 'Chest', color: MUSCLE_COLORS.chest },
	{ label: 'Back', color: MUSCLE_COLORS.back },
	{ label: 'Shoulders', color: MUSCLE_COLORS.shoulders },
	{ label: 'Quads', color: MUSCLE_COLORS.quads },
	{ label: 'Hamstrings & Glutes', color: MUSCLE_COLORS.hamstringsGlutes },
];

export function AbstractPhysiqueDiagram() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Front</p>
					<div className="flex justify-center">
						<FrontSilhouette />
					</div>
				</div>
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Back</p>
					<div className="flex justify-center">
						<BackSilhouette />
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
				{legendItems.map((item) => (
					<div key={item.label} className="flex items-center gap-2 text-xs text-gray-light">
						<span className="inline-block h-2.5 w-2.5 rotate-45" style={{ backgroundColor: item.color }} />
						<span>{item.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
