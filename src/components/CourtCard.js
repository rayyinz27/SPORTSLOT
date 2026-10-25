import Link from 'next/link';
import { MapPin, Star, Layers, Sun } from 'lucide-react';
import CourtImage from './CourtImage';
import { rupiah } from '@/lib/utils';

export default function CourtCard({ court }) {
  return (
    <Link href={`/courts/${court.id}`} className="card flex gap-3 p-2.5 transition hover:border-brand/40">
      <CourtImage src={court.image_url} alt={court.name} className="h-20 w-24 shrink-0 rounded-xl sm:h-24 sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{court.name}</h3>
            <span className="flex shrink-0 items-center gap-1 text-xs"><Star size={12} className="fill-yellow-400 text-yellow-400" />{Number(court.rating).toFixed(2)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="chip"><MapPin size={11} />{court.city}</span>
            <span className="chip"><Layers size={11} />{court.surface}</span>
            <span className="chip"><Sun size={11} />{court.setting}</span>
          </div>
        </div>
        <p className="text-sm font-bold">{rupiah(court.price_per_hour)} <span className="text-[10px] font-normal text-neutral-500">/ jam</span></p>
      </div>
    </Link>
  );
}
