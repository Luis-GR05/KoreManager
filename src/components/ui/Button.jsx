// src/components/ui/Button.jsx
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    ...props
}) {

    // 1. Estilos Base (Se aplican siempre)
    const baseStyles = "font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // 2. Diccionario de Variantes (Colores)
    const variants = {
        primary: "bg-brand-lime text-black hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:scale-[1.02]",
        secondary: "bg-dark-elevated text-white border border-white/10 hover:border-brand-lime/50",
        danger: "bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/20 hover:bg-semantic-danger/20",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
    };

    // 3. Diccionario de Tamaños (Padding y Textos)
    const sizes = {
        sm: "py-2 px-4 text-sm",
        md: "py-3 px-6 text-base",
        lg: "py-4 px-8 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : children}
        </button>
    );
}