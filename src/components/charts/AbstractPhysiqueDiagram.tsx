import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';

const MUSCLE_COLORS = {
	chest: '#236bd8',
	back: '#236bd8',
	shoulders: '#236bd8',
	quadriceps: '#236bd8',
	hamstringGlutes: '#236bd8',
	biceps: '#236bd8',
	triceps: '#236bd8',
	noData: '#163056',
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
	musclePercentiles?: {
		chest: number | null;
		back: number | null;
		shoulders: number | null;
		quadriceps: number | null;
		hamstringGlutes: number | null;
		biceps: number | null;
		triceps: number | null;
	};
	musclePercentileDetails?: {
		chest: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		back: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		shoulders: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		quadriceps: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		hamstringGlutes: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		biceps: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
		triceps: { percentile: number | null; contributors: Array<{ exercise: string; percentile: number }> };
	};
}

type DiagramMuscleKey = keyof typeof MUSCLE_COLORS extends infer Key
	? Extract<Key, 'chest' | 'back' | 'shoulders' | 'quadriceps' | 'hamstringGlutes' | 'biceps' | 'triceps'>
	: never;

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

function getMuscleColor(
	baseColor: string,
	value: number | null,
	maxValue: number,
	mode: 'volume' | 'percentile' = 'volume',
	averagePercentile?: number | null
): string {
	if (value === null) {
		return mode === 'percentile' ? MUSCLE_COLORS.noData : baseColor;
	}

	if (maxValue === 0) return baseColor;

	if (mode === 'percentile' && averagePercentile !== null && averagePercentile !== undefined) {
		const difference = value - averagePercentile;

		if (difference <= -5) {
			// const intensity = Math.min((Math.abs(difference) - 5) / 20, 1);
			// const lightness = Math.round(52 - intensity * 14);
			const lightness = Math.round(Math.max(45+(difference+5)*3,35))
			return `hsl(4 60% ${lightness}%)`;
		}

		if (difference >= 5) {
			// const intensity = Math.min((difference - 5) / 20, 1);
			// const lightness = Math.round(46 - intensity * 12);
			const lightness = Math.round(Math.max(45-(difference-5)*3,20))
			return `hsl(148 75% ${lightness}%)`;
		}

		return 'hsl(210 85% 45%)';
	}

	const { h, s } = hexToHsl(baseColor);
	
	// For percentile mode, normalize to 0-100
	const normalizedValue = mode === 'percentile' ? (value / 100) * 1.2 : value / maxValue * 1.2;
	const ratio = Math.min(normalizedValue, 1);
	
	const minLight = 20;
	const maxLight = 65;
	const lightness = Math.round(minLight + ratio * (maxLight - minLight));

	return `hsl(${h} 85% ${lightness}%)`;
}

function FrontSilhouette({
	muscleVolumes,
	musclePercentiles,
	maxVolume,
	mode,
	averagePercentile,
}: {
	muscleVolumes?: Props['muscleVolumes'];
	musclePercentiles?: Props['musclePercentiles'];
	maxVolume: number;
	mode: 'volume' | 'percentile';
	averagePercentile?: number | null;
}) {
	const getValue = (muscleKey: 'chest' | 'back' | 'shoulders' | 'quadriceps' | 'hamstringGlutes' | 'biceps' | 'triceps') => {
		if (mode === 'percentile' && musclePercentiles) {
			return musclePercentiles[muscleKey];
		}
		if (muscleVolumes) {
			return muscleVolumes[muscleKey];
		}
		return 0;
	};

	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Front silhouette">
			<circle cx="60" cy="17" r="13" fill={MUSCLE_COLORS.base} />

			<polygon
				points="12,46 33,46 30,95 17,92"
				fill={getMuscleColor(MUSCLE_COLORS.biceps, getValue('biceps'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="87,46 108,46 103,92 90,95"
				fill={getMuscleColor(MUSCLE_COLORS.biceps, getValue('biceps'), maxVolume, mode, averagePercentile)}
			/>

			<polygon points="40,178 56,184 56,210 54,235 46,235 40,215" fill={MUSCLE_COLORS.base} />
			<polygon points="80,178 64,184 64,210 66,235 74,235 80,215" fill={MUSCLE_COLORS.base} />

			<circle
				cx="23"
				cy="46"
				r="11"
				fill={getMuscleColor(MUSCLE_COLORS.shoulders, getValue('shoulders'), maxVolume, mode, averagePercentile)}
			/>
			<circle
				cx="97"
				cy="46"
				r="11"
				fill={getMuscleColor(MUSCLE_COLORS.shoulders, getValue('shoulders'), maxVolume, mode, averagePercentile)}
			/>

			<polygon
				points="52,31 68,31 86,38 34,38"
				fill={getMuscleColor(MUSCLE_COLORS.chest, getValue('chest'), maxVolume, mode, averagePercentile)}
			/>
			<polygon points="34,54 86,54 81,75 39,75" fill={MUSCLE_COLORS.behind} />
			<polygon points="39,75 81,75 74,89 46,89" fill={MUSCLE_COLORS.behind} />
			<polygon
				points="34,38 86,38 86,54 34,54"
				fill={getMuscleColor(MUSCLE_COLORS.chest, getValue('chest'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="34,54 86,54 80,65 40,65"
				fill={getMuscleColor(MUSCLE_COLORS.chest, getValue('chest'), maxVolume, mode, averagePercentile)}
			/>
			<polygon points="40,65 80,65 74,78 46,78" fill={MUSCLE_COLORS.base} />
			<polygon points="46,78 74,78 72,104 48,104" fill={MUSCLE_COLORS.base} />

			<polygon
				points="48,104 72,104 62,119 58,119"
				fill={getMuscleColor(MUSCLE_COLORS.quadriceps, getValue('quadriceps'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="36,119 48,104 58,119 58,176 56,180 38,173"
				fill={getMuscleColor(MUSCLE_COLORS.quadriceps, getValue('quadriceps'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="62,119 72,104 84,119 82,173 64,180 62,176"
				fill={getMuscleColor(MUSCLE_COLORS.quadriceps, getValue('quadriceps'), maxVolume, mode, averagePercentile)}
			/>
		</svg>
	);
}

function BackSilhouette({
	muscleVolumes,
	musclePercentiles,
	maxVolume,
	mode,
	averagePercentile,
}: {
	muscleVolumes?: Props['muscleVolumes'];
	musclePercentiles?: Props['musclePercentiles'];
	maxVolume: number;
	mode: 'volume' | 'percentile';
	averagePercentile?: number | null;
}) {
	const getValue = (muscleKey: 'chest' | 'back' | 'shoulders' | 'quadriceps' | 'hamstringGlutes' | 'biceps' | 'triceps') => {
		if (mode === 'percentile' && musclePercentiles) {
			return musclePercentiles[muscleKey];
		}
		if (muscleVolumes) {
			return muscleVolumes[muscleKey];
		}
		return 0;
	};

	return (
		<svg viewBox="0 0 120 260" className="w-full max-w-[140px]" aria-label="Back silhouette">
			<circle cx="60" cy="17" r="13" fill={MUSCLE_COLORS.base} />

			<polygon
				points="12,46 33,46 30,95 17,92"
				fill={getMuscleColor(MUSCLE_COLORS.triceps, getValue('triceps'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="87,46 108,46 103,92 90,95"
				fill={getMuscleColor(MUSCLE_COLORS.triceps, getValue('triceps'), maxVolume, mode, averagePercentile)}
			/>

			<polygon points="40,178 56,184 56,210 54,235 46,235 40,215" fill={MUSCLE_COLORS.base} />
			<polygon points="80,178 64,184 64,210 66,235 74,235 80,215" fill={MUSCLE_COLORS.base} />

			<circle cx="23" cy="46" r="11" fill={MUSCLE_COLORS.base} />
			<circle cx="97" cy="46" r="11" fill={MUSCLE_COLORS.base} />

			<polygon
				points="52,31 68,31 86,38 34,38"
				fill={getMuscleColor(MUSCLE_COLORS.back, getValue('back'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="34,38 86,38 86,54 34,54"
				fill={getMuscleColor(MUSCLE_COLORS.back, getValue('back'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="34,54 86,54 81,75 39,75"
				fill={getMuscleColor(MUSCLE_COLORS.back, getValue('back'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="39,75 81,75 74,89 46,89"
				fill={getMuscleColor(MUSCLE_COLORS.back, getValue('back'), maxVolume, mode, averagePercentile)}
			/>
			<polygon points="46,89 74,89 72,104 48,104" fill={MUSCLE_COLORS.base} />

			<polygon
				points="48,104 72,104 62,119 58,119"
				fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, getValue('hamstringGlutes'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="36,119 48,104 58,119 58,176 56,180 38,173"
				fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, getValue('hamstringGlutes'), maxVolume, mode, averagePercentile)}
			/>
			<polygon
				points="62,119 72,104 84,119 82,173 64,180 62,176"
				fill={getMuscleColor(MUSCLE_COLORS.hamstringGlutes, getValue('hamstringGlutes'), maxVolume, mode, averagePercentile)}
			/>
		</svg>
	);
}

const legendItems: Array<{ key: DiagramMuscleKey; label: string; color: string }> = [
	{ key: 'chest', label: 'Chest', color: MUSCLE_COLORS.chest },
	{ key: 'back', label: 'Back', color: MUSCLE_COLORS.back },
	{ key: 'shoulders', label: 'Shoulders', color: MUSCLE_COLORS.shoulders },
	{ key: 'biceps', label: 'Biceps', color: MUSCLE_COLORS.biceps },
	{ key: 'triceps', label: 'Triceps', color: MUSCLE_COLORS.triceps },
	{ key: 'quadriceps', label: 'Quadriceps', color: MUSCLE_COLORS.quadriceps },
	{ key: 'hamstringGlutes', label: 'Hamstrings & Glutes', color: MUSCLE_COLORS.hamstringGlutes },
];

function formatPercentile(value: number | null): string {
	if (value === null) return '—';
	return `${Math.round(value)}th`;
}

function formatPercentileDelta(value: number | null, averagePercentile: number | null): string {
	if (value === null || averagePercentile === null) return '';

	const difference = Math.round(value - averagePercentile);
	return ` (${difference >= 0 ? '+' : ''}${difference} vs avg)`;
}

export function AbstractPhysiqueDiagram({
	muscleVolumes,
	musclePercentiles,
	musclePercentileDetails,
}: Props) {
	const [heatmapMode, setHeatmapMode] = useState<'volume' | 'percentile'>('volume');
	const weightUnit = useUserStore((state) => state.weightUnit);

	const averagePercentile = (() => {
		if (!musclePercentiles) return null;

		const values = Object.values(musclePercentiles).filter((value): value is number => value !== null);
		if (values.length === 0) return null;

		return values.reduce((sum, value) => sum + value, 0) / values.length;
	})();

	// Determine max value based on mode
	const maxValue = (() => {
		if (heatmapMode === 'percentile' && musclePercentiles) {
			const values = [
				musclePercentiles.chest,
				musclePercentiles.back,
				musclePercentiles.shoulders,
				musclePercentiles.biceps,
				musclePercentiles.triceps,
				musclePercentiles.quadriceps,
				musclePercentiles.hamstringGlutes,
			].filter((v) => v !== null) as number[];
			return Math.max(...values, 1);
		}

		if (muscleVolumes) {
			return Math.max(
				muscleVolumes.chest,
				muscleVolumes.back,
				muscleVolumes.shoulders,
				muscleVolumes.biceps,
				muscleVolumes.triceps,
				muscleVolumes.quadriceps,
				muscleVolumes.hamstringGlutes
			);
		}
		return 0;
	})();

	const displayVolumes = heatmapMode === 'volume' ? muscleVolumes : undefined;
	const displayPercentiles = heatmapMode === 'percentile' ? musclePercentiles : undefined;

	// Sort legend items by volume or percentile (highest to lowest)
	const sortedLegendItems = (() => {
		if (heatmapMode === 'volume' && muscleVolumes) {
			return [...legendItems].sort((a, b) => {
				const volumeA = muscleVolumes[a.key] || 0;
				const volumeB = muscleVolumes[b.key] || 0;
				return volumeB - volumeA;
			});
		}
		if (heatmapMode === 'percentile' && musclePercentiles) {
			return [...legendItems].sort((a, b) => {
				const percentileA = musclePercentiles[a.key] ?? -Infinity;
				const percentileB = musclePercentiles[b.key] ?? -Infinity;
				return percentileB - percentileA;
			});
		}
		return legendItems;
	})();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium text-gray-light">Physique Balance</h3>
					{/* {heatmapMode === 'percentile' && averagePercentile !== null && (
						<p className="text-[11px] text-gray-text">Average percentile: {formatPercentile(averagePercentile)}</p>
					)} */}
				</div>
				{musclePercentiles && (
					<div className="flex gap-1 bg-dark-600 p-1 rounded">
						<button
							onClick={() => setHeatmapMode('volume')}
							className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
								heatmapMode === 'volume'
									? 'bg-blue-500 text-white'
									: 'text-gray-text hover:text-gray-light'
							}`}
						>
							Volume
						</button>
						<button
							onClick={() => setHeatmapMode('percentile')}
							className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
								heatmapMode === 'percentile'
									? 'bg-blue-500 text-white'
									: 'text-gray-text hover:text-gray-light'
							}`}
						>
							Percentile
						</button>
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Front</p>
					<div className="flex justify-center">
						<FrontSilhouette
							muscleVolumes={displayVolumes}
							musclePercentiles={displayPercentiles}
							maxVolume={maxValue}
							mode={heatmapMode}
								averagePercentile={averagePercentile}
						/>
					</div>
				</div>
				<div className="rounded-sm border border-dark-500 bg-gradient-to-b from-[#1b2a44] to-[#111827] p-3">
					<p className="text-[10px] tracking-wider uppercase text-gray-text mb-2">Back</p>
					<div className="flex justify-center">
						<BackSilhouette
							muscleVolumes={displayVolumes}
							musclePercentiles={displayPercentiles}
							maxVolume={maxValue}
							mode={heatmapMode}
								averagePercentile={averagePercentile}
						/>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-2">
				{sortedLegendItems.map((item) => {
					const muscleColor =
						heatmapMode === 'percentile' && musclePercentileDetails
							? getMuscleColor(
									item.color,
									musclePercentileDetails[item.key].percentile,
									100,
									'percentile',
									averagePercentile
							  )
							: heatmapMode === 'volume' && muscleVolumes
							? getMuscleColor(item.color, muscleVolumes[item.key], maxValue, 'volume')
							: item.color;

					return (
						<div key={item.label} className="flex items-start gap-2 text-xs text-gray-light">
							<span
								className="mt-1 inline-block h-2.5 w-2.5 rotate-45"
								style={{
									backgroundColor: muscleColor,
								}}
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-x-2 gap-y-1">
									<span className="font-medium text-white-text">{item.label}</span>
									{heatmapMode === 'percentile' && musclePercentileDetails && (
										musclePercentileDetails[item.key].percentile === null ? (
											<span className="text-blue-400">No data</span>
										) : (
											<span className="text-blue-300">
												{formatPercentileDelta(musclePercentileDetails[item.key].percentile, averagePercentile)}
											</span>
										)
									)}
									{heatmapMode === 'volume' && muscleVolumes && (
										<span className="ml-auto text-blue-400 font-medium">
											{Math.round(muscleVolumes[item.key])} {weightUnit}
										</span>
									)}
								</div>
								{heatmapMode === 'percentile' && musclePercentileDetails && (
									<p className="mt-0.5 text-[11px] leading-relaxed text-gray-text">
										[
										{musclePercentileDetails[item.key].contributors.length > 0
											? musclePercentileDetails[item.key].contributors
													.map((contributor) => `${contributor.exercise}`)
													.join(', ')
											: 'No recorded data'}
										]
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
