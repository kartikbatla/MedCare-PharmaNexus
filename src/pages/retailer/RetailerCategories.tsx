import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Pill } from 'lucide-react';
import { medicineCategories, medicines } from '../../data/medicines';

export default function RetailerCategories() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-brand-charcoal">
          <Layers size={20} /> Categories
        </h1>
        <p className="mt-1 text-[13px] text-brand-charcoal/55">
          {medicineCategories.length} therapeutic categories across {medicines.length} medicines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {medicineCategories.map((c) => {
          const count = medicines.filter((m) => m.category === c).length;
          const sample = medicines.find((m) => m.category === c);
          return (
            <Link
              key={c}
              to={`/retailer/medicines?category=${encodeURIComponent(c)}`}
              className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-panel"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy/[0.06] text-brand-muted transition-colors group-hover:bg-brand-navy group-hover:text-white">
                  <Pill size={20} />
                </span>
                <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-[11.5px] font-semibold text-brand-charcoal/60 tabular-nums">
                  {count} medicines
                </span>
              </div>
              <h2 className="mt-3.5 text-[14.5px] font-semibold text-brand-charcoal">{c}</h2>
              {sample && (
                <p className="mt-1 text-[12px] text-brand-charcoal/50">
                  e.g. {sample.name} · {sample.dosageForm}
                </p>
              )}
              <p className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-brand-muted transition-colors group-hover:text-brand-navy">
                Browse category <ArrowRight size={13} />
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
