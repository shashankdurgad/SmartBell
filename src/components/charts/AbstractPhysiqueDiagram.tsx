const MUSCLE_COLORS = {
	chest: '#236bd8',
	back: '#236bd8',
	shoulders: '#236bd8',
	quadriceps: '#236bd8',
	hamstringGlutes: '#236bd8',
	biceps: '#236bd8',
	triceps: '#236bd8',
	base: '#353f4d',
	behind: '#2a323d',
} as const;

interface Props {
	muscleVolumes?: {
		chest: number;
		back: number;
		shoulders: number;
		quadriceps: number;
		hamstringGlutes: number;
		biceps: number;
		triceps: number;
	};
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	let h = 0;
	let s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		if (max === r) {
			h = 60 * (((g - b) / d) % 6);
		} else if (max === g) {
			h = 60 * ((b - r) / d + 2);
		} else {
			h = 60 * ((r - g) / d + 4);
		}
	}

	return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getMuscleColor(baseColor: string, volume: number, maxVolume: number): string {
	if (maxVolume === 0) return baseColor;

	const { h, s } = hexToHsl(baseColor);
	const ratio = Math.min(volume / maxVolume * 1.2, 1);
	const minLight = 20;
	const maxLight = 65;
	const lightness = Math.round(minLight + ratio * (maxLight - minLight));

	return `hsl(${h} ${s}% ${lightness}%)`;
}

function FrontSilhouette({ muscleVolumes, maxVolume }: { muscleVolumes?: Props['muscleVolumes']; maxVolume: number }) {
	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Front silhouette">
			<circle cx="60" cy="17" r="13" fill={MUSCLE_COLORS.base} />

			<polygon points="12,46 33,46 30,95 17,92" fill={getMuscleColor(MUSCLE_COLORS.biceps, muscleVolumes?.biceps || 0, maxVolume)} />
			<polygon points="87,46 108,46 103,92 90,95" fill={getMuscleColor(MUSCLE_COLORS.biceps, muscleVolumes?.biceps || 0, maxVolume)} />

			<polygon points="40,178 56,184 56,210 54,235 46,235 40,215" fill={MUSCLE_COLORS.base} />
			<polygon points="80,178 64,184 64,210 66,235 74,235 80,215" fill={MUSCLE_COLORS.base} />

			<circle cx="23" cy="46" r="11" fill={getMuscleColor(MUSCLE_COLORS.shoulders, muscleVolumes?.shoulders || 0, maxVolume)} />
			<circle cx="97" cy="46" r="11" fill={getMuscleColor(MUSCLE_COLORS.shoulders, muscleVolumes?.shoulders || 0, maxVolume)} />

            <polygon points="52,31 68,31 86,38 34,38" fill={getMuscleColor(MUSCLE_COLORS.chest, muscleVolumes?.chest || 0, maxVolume)} />
			<polygon points="34,54 86,54 81,75 39,75" fill={MUSCLE_COLORS.behind} />
			<polygon points="39,75 81,75 74,89 46,89" fill={MUSCLE_COLORS.behind} />
            <polygon points="34,38 86,38 86,54 34,54" fill={getMuscleColor(MUSCLE_COLORS.chest, muscleVolumes?.chest || 0, maxVolume)} />
			<polygon points="34,54 86,54 80,65 40,65" fill={getMuscleColor(MUSCLE_COLORS.chest, muscleVolumes?.chest || 0, maxVolume)} />
			<polygon points="40,65 80,65 74,78 46,78" fill={MUSCLE_COLORS.base} />
			<polygon points="46,78 74,78 72,104 48,104" fill={MUSCLE_COLORS.base} />

			<polygon points="48,104 72,104 62,119 58,119" fill={getMuscleColor(MUSCLE_COLORS.quadriceps, muscleVolumes?.quadriceps || 0, maxVolume)} />
			<polygon points="36,119 48,104 58,119 58,176 56,180 38,173" fill={getMuscleColor(MUSCLE_COLORS.quadriceps, muscleVolumes?.quadriceps || 0, maxVolume)} />
			<polygon points="62,119 72,104 84,119 82,173 64,180 62,176" fill={getMuscleColor(MUSCLE_COLORS.quadriceps, muscleVolumes?.quadriceps || 0, maxVolume)} />
		</svg>
	);
}

function BackSilhouette({ muscleVolumes, maxVolume }: { muscleVolumes?: Props['muscleVolumes']; maxVolume: number }) {
	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Back silhouette">
			<circle cx="60" cy="17" r="13" fill={MUSCLE_COLORS.base} />

			<polygon points="12,46 33,46 30,95 17,92" fill={getMuscleColor(MUSCLE_COLORS.triceps, muscleVolumes?.triceps || 0, maxVolume)} />
			<polygon points="87,46 108,46 103,92 90,95" fill={getMuscleColor(MUSCLE_COLORS.triceps, muscleVolumes?.triceps || 0, maxVolume)} />

			<polygon points="40,178 56,184 56,210 54,235 46,235 40,215" fill={MUSCLE_COLORS.base} />
			<polygon points="80,178 64,184 64,210 66,235 74,235 80,215" fill={MUSCLE_COLORS.base} />

			<circle cx="23" cy="46" r="11" fill={MUSCLE_COLORS.base} />
			<circle cx="97" cy="46" r="11" fill={MUSCLE_COLORS.base} />

            <polygon points="52,31 68,31 86,38 34,38" fill={getMuscleColor(MUSCLE_COLORS.back, muscleVolumes?.back || 0, maxVolume)} />
            <polygon points="34,38 86,38 86,54 34,54" fill={getMuscleColor(MUSCLE_COLORS.back, muscleVolumes?.back || 0, maxVolume)} />
			<polygon points="34,54 86,54 81,75 39,75" fill={getMuscleColor(MUSCLE_COLORS.back, muscleVolumes?.back || 0, maxVolume)} />
			<polygon points="39,75 81,75 74,89 46,89" fill={getMuscleColor(MUSCLE_COLORS.back, muscleVolumes?.back || 0, maxVolume)} />
			<polygon points="46,89 74,89 72,104 48,104" fill={MUSCLE_COLORS.base} />

			<polygon points="48,104 72,104 62,119 58,119" fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, muscleVolumes?.hamstringGlutes || 0, maxVolume)} />
			<polygon points="36,119 48,104 58,119 58,176 56,180 38,173" fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, muscleVolumes?.hamstringGlutes || 0, maxVolume)} />
			<polygon points="62,119 72,104 84,119 82,173 64,180 62,176" fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, muscleVolumes?.hamstringGlutes || 0, maxVolume)} />
		</svg>
	);
}

const legendItems = [
	{ label: 'Chest', color: MUSCLE_COLORS.chest },
	{ label: 'Back', color: MUSCLE_COLORS.back },
	{ label: 'Shoulders', color: MUSCLE_COLORS.shoulders },
	{ label: 'Biceps', color: MUSCLE_COLORS.biceps },
	{ label: 'Triceps', color: MUSCLE_COLORS.triceps },
	{ label: 'Quadriceps', color: MUSCLE_COLORS.quadriceps },
	{ label: 'Hamstrings & Glutes', color: MUSCLE_COLORS.hamstringGlutes },
];

export function AbstractPhysiqueDiagram({ muscleVolumes }: Props) {
	const maxVolume = muscleVolumes
		? Math.max(
				muscleVolumes.chest,
				muscleVolumes.back,
				muscleVolumes.shoulders,
				muscleVolumes.biceps,
				muscleVolumes.triceps,
				muscleVolumes.quadriceps,
				muscleVolumes.hamstringGlutes
			)
		: 0;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Front</p>
					<div className="flex justify-center">
						<FrontSilhouette muscleVolumes={muscleVolumes} maxVolume={maxVolume} />
					</div>
				</div>
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Back</p>
					<div className="flex justify-center">
						<BackSilhouette muscleVolumes={muscleVolumes} maxVolume={maxVolume} />
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
