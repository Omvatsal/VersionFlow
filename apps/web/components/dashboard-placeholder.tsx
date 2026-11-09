import Link from 'next/link';
import { ArrowLeft, GitBranch } from 'lucide-react';
export function DashboardPlaceholder({ title, label, description }: { title: string; label: string; description: string }) { return <div className="placeholder-page"><div className="placeholder-icon"><GitBranch size={23} /></div><p className="page-kicker">{label}</p><h2>{title}</h2><p>{description}</p><Link href="/dashboard" className="text-link"><ArrowLeft size={15} /> Back to overview</Link></div>; }
