/**
 * Input de UI con icono opcional y mensaje de error.
 *
 * @param {{icon?: any, error?: string, className?: string, [key: string]: any}} props
 * @returns {import('react').JSX.Element}
 */
export default function Input({ icon: Icon, error, className = '', ...props }) {
    return (
        <div className="relative group w-full mb-4">
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

            {error && (
                <span className="text-xs font-medium text-semantic-danger mt-1 absolute -bottom-5 left-1">
                    {error}
                </span>
            )}
        </div>
    );
}