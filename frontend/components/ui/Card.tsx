import * as React from "react"
import { cn } from "./Button"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, title, subtitle, headerAction, footer, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-xl border border-white/10 bg-[#12121a] overflow-hidden transition-all duration-200 hover:border-indigo-500/30",
                className
            )}
            {...props}
        >
            {(title || subtitle || headerAction) && (
                <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        {title && <h3 className="text-xl font-semibold leading-none tracking-tight text-white">{title}</h3>}
                        {headerAction && <div className="ml-auto">{headerAction}</div>}
                    </div>
                    {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
                </div>
            )}
            <div className={cn("p-6", (title || subtitle || headerAction) ? "pt-6" : "")}>
                {children}
            </div>
            {footer && (
                <div className="flex items-center p-4 pt-4 border-t border-white/10 bg-white/5 text-sm">
                    {footer}
                </div>
            )}
        </div>
    )
)
Card.displayName = "Card"

// Backwards compatibility for other components
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight text-white", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate-400", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export default Card;
