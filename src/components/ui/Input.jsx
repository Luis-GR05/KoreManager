// src/components/ui/Input.jsx
export default function Input({ icon: Icon, error, className = '', ...props }) {
    return (
        <div className="relative group w-full mb-4">
            {/* Si le pasamos un icono, lo renderiza automáticamente */}
            {Icon && (
                <Icon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-lime transition-colors"
                    size={20}
                />
            )}

            <input
                className={`w-full bg-dark-base border ${error ? 'border-semantic-danger focus:border-semantic-danger' : 'border-white/10 focus:border-brand-lime'
                    } rounded-xl py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-white focus:outline-none transition-all ${className}`}
                {...props}
            />

            {/* Si hay un error, lo pinta debajo en rojo semántico */}
            {error && (
                <span className="text-xs font-medium text-semantic-danger mt-1 absolute -bottom-5 left-1">
                    {error}
                </span>
            )}
        </div>
    );
}