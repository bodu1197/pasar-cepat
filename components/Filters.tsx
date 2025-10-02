
import React, { useState, useMemo } from 'react';
import { FilterIcon, ChevronDownIcon } from './Icons';

interface FilterValues {
  category: { primary: string; secondary: string };
  location: { province: string; city: string };
}

interface Category {
    name: string;
    subcategories: string[];
}

interface Locations {
    [key: string]: string[];
}

interface FiltersProps {
  activeFilters: FilterValues;
  onFilterChange: (filterType: 'location' | 'category', value: any) => void;
  onResetFilters: () => void;
  categories: Category[];
  locations: Locations;
}

const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div className="relative flex-1 min-w-[calc(50%-0.5rem)]">
        <select
            {...props}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
        >
            {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </div>
    </div>
);

export const Filters: React.FC<FiltersProps> = ({ activeFilters, onFilterChange, onResetFilters, categories, locations }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrimaryCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('category', { primary: e.target.value, secondary: '' });
  };
  
  const handleSecondaryCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('category', { ...activeFilters.category, secondary: e.target.value });
  };
  
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('location', { province: e.target.value, city: '' });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('location', { ...activeFilters.location, city: e.target.value });
  };

  const selectedPrimaryCategory = useMemo(() => {
    return categories.find(c => c.name === activeFilters.category.primary);
  }, [categories, activeFilters.category.primary]);

  const availableCities = useMemo(() => {
    return locations[activeFilters.location.province] || [];
  }, [locations, activeFilters.location.province]);

  const isFilterActive = activeFilters.category.primary || activeFilters.location.province;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-center items-center gap-2 bg-gray-800 border border-gray-700 rounded-full py-2 px-4 text-white hover:bg-gray-700 transition-colors"
      >
        <FilterIcon />
        <span>Filter</span>
        {isFilterActive && <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>}
      </button>

      {isOpen && (
        <div className="bg-gray-800 p-4 mt-2 rounded-lg border border-gray-700 space-y-4">
          <div className="flex gap-4 justify-between flex-wrap">
             <SelectInput label="Kategori" value={activeFilters.category.primary} onChange={handlePrimaryCategoryChange}>
                <option value="">Semua Kategori</option>
                {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
             </SelectInput>
             <SelectInput label="Sub-Kategori" value={activeFilters.category.secondary} onChange={handleSecondaryCategoryChange} disabled={!selectedPrimaryCategory}>
                <option value="">Semua Sub-Kategori</option>
                {selectedPrimaryCategory?.subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
             </SelectInput>
          </div>
           <div className="flex gap-4 justify-between flex-wrap">
             <SelectInput label="Provinsi" value={activeFilters.location.province} onChange={handleProvinceChange}>
                <option value="">Semua Provinsi</option>
                {Object.keys(locations).map(prov => <option key={prov} value={prov}>{prov}</option>)}
             </SelectInput>
             <SelectInput label="Kota" value={activeFilters.location.city} onChange={handleCityChange} disabled={availableCities.length === 0}>
                <option value="">Semua Kota</option>
                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
             </SelectInput>
          </div>
          {isFilterActive && (
             <button 
                onClick={onResetFilters} 
                className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors py-1">
                Atur Ulang Filter
             </button>
          )}
        </div>
      )}
    </div>
  );
};
