import type {MenuItem} from '@/types';
import { Star, Sparkles } from 'lucide-react';

interface ArticleGridProps {
    items: MenuItem[];
    onItemSelect: (item: MenuItem) => void;
}

export const ArticleGrid = ({ items, onItemSelect }: ArticleGridProps) => {
    console.log(items);
    return (
        <div className="flex-1 p-2 pr-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-0">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onItemSelect(item)}
                        disabled={!item.disponible}
                        className={`
              theme-menu-card p-1.5 h-14 w-full flex flex-col items-center justify-center text-xs font-medium transition-all duration-300 relative border-0 rounded-none
              ${!item.disponible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        {item.populaire && (
                            <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                        )}
                        {item.special && (
                            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-500 fill-current" />
                        )}
                        <div className="line-clamp-2 text-center theme-foreground-text mb-1">
                            {item.nom}
                        </div>
                        <div className="theme-primary-text font-semibold">
                            {item.prix.toFixed(2)}€
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};