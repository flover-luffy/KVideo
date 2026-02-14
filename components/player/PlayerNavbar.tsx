import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Icons } from '@/components/ui/Icon';
import { siteConfig } from '@/lib/config/site-config';

export function PlayerNavbar({ isPremium }: { isPremium?: boolean }) {
    const router = useRouter();

    return (
        <nav className="sticky top-0 z-50 pt-3 pb-1" style={{ transform: 'translateZ(0)' }}>
            <div className="max-w-5xl mx-auto px-3 sm:px-4">
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[var(--shadow-sm)] px-3 py-2 rounded-2xl" style={{
                    transform: 'translate3d(0, 0, 0)'
                }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-color-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--glass-hover)] transition-all duration-200 cursor-pointer"
                                aria-label="返回"
                            >
                                <Icons.ChevronLeft size={20} />
                            </button>
                            <Link
                                href={isPremium ? '/premium' : '/'}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <div className="w-7 h-7 relative flex items-center justify-center flex-shrink-0">
                                    <Image
                                        src="/icon.png"
                                        alt={siteConfig.name}
                                        width={28}
                                        height={28}
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-base font-bold text-[var(--text-color)] hidden sm:inline">{siteConfig.name}</span>
                            </Link>
                        </div>
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </nav>
    );
}
