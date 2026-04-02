"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Employee {
  id: string;
  employee_name_th: string;
  employee_code: string;
  department?: string | null;
  position?: string | null;
}

export interface EmployeeSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  placeholder?: string;
  className?: string;
}

export function EmployeeSearchSelect({ 
  value, 
  onChange, 
  employees, 
  placeholder = "เลือกพนักงาน... / Select Employee...",
  className
}: EmployeeSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' as 'top' | 'bottom' });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current selected name
  const selectedEmployee = employees.find(emp => emp.employee_name_th === value || emp.id === value || emp.employee_code === value);
  const displayValue = selectedEmployee ? `${selectedEmployee.employee_name_th}` : (value || "");

  const filteredEmployees = employees.filter(emp => 
    emp.employee_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_code && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update position on open or scroll
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const spaceBelow = window.innerHeight - rect.bottom;
          const dropdownHeight = 350; // Max estimated height
          const placement = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';
          
          setDropdownPos({
            top: placement === 'bottom' ? rect.bottom : rect.top,
            left: rect.left,
            width: rect.width,
            placement
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const Dropdown = (
    <div 
      ref={dropdownRef}
      className={cn(
        "fixed z-9999 bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl",
        dropdownPos.placement === 'top' ? "origin-bottom" : "origin-top"
      )}
      style={{
        top: dropdownPos.placement === 'top' ? 'auto' : dropdownPos.top + 8,
        bottom: dropdownPos.placement === 'top' ? (window.innerHeight - dropdownPos.top) + 8 : 'auto',
        left: dropdownPos.left,
        width: dropdownPos.width,
      }}
    >
      <div className="p-3 border-b border-zinc-50 flex items-center gap-2 bg-zinc-50/30 text-zinc-900">
        <Search className="h-4 w-4 text-zinc-400" />
        <input 
          autoFocus
          className="w-full bg-transparent border-none outline-none text-sm font-medium"
          placeholder="ค้นหาชื่อ, รหัส หรือ แผนก... / Search name, ID or dept..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        {searchTerm && (
           <button onClick={(e) => { e.stopPropagation(); setSearchTerm(""); }} className="p-1 hover:bg-white rounded-lg">
              <X className="h-3 w-3 text-zinc-400" />
           </button>
        )}
      </div>
      <div className="max-h-[250px] overflow-y-auto pt-1">
        {filteredEmployees.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest italic">
            ไม่พบข้อมูล / No results found
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = value === emp.employee_name_th || value === emp.employee_code;
            return (
              <div 
                key={emp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(emp.employee_name_th);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={cn(
                  "px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between group hover:bg-[#0F1059]/5 transition-colors",
                  isSelected && "bg-[#0F1059]/5 text-[#0F1059]"
                )}
              >
                <div className="flex flex-col min-w-0">
                   <div className="flex items-center gap-2">
                       <span className={cn("font-medium truncate transition-colors", isSelected ? "text-[#0F1059]" : "text-zinc-700")}>
                          {emp.employee_name_th}
                       </span>
                       <Badge2 text={emp.employee_code} />
                   </div>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight truncate group-hover:text-[#0F1059]/40">
                      {emp.department && emp.position ? `${emp.department} • ${emp.position}` : (emp.department || emp.position || '---')}
                   </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-[#0F1059] shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        onClick={() => {
            if (!isOpen && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 350;
                const placement = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';

                setDropdownPos({
                    top: placement === 'bottom' ? rect.bottom : rect.top,
                    left: rect.left,
                    width: rect.width,
                    placement
                });
            }
            setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-100/50",
          isOpen && "border-[#0F1059]/20 ring-2 ring-[#0F1059]/5 bg-white"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <User className={cn("h-4 w-4 shrink-0", displayValue ? "text-[#0F1059]" : "text-zinc-400")} />
          <span className={cn("truncate", !displayValue && "text-zinc-400")}>
            {displayValue || placeholder}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && dropdownPos.top > 0 && typeof document !== 'undefined' && createPortal(Dropdown, document.body)}
    </div>
  );
}

function Badge2({ text }: { text: string }) {
    if (!text) return null;
    return (
        <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-tighter">
            {text}
        </span>
    );
}
