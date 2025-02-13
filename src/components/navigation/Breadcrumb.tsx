import { cn } from '../../lib/utils';
import Link from 'next/link';

interface BreadcrumbProps {
  items: {
    label: string;
    href: string;
  }[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-gray-400">/</span>
          )}
          <Link 
            href={item.href}
            className="text-gray-600 hover:text-blue-600 hover:underline"
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
} 