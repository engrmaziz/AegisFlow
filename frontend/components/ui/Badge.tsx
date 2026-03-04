import * as React from "react"
import { cn } from "./Button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    size?: 'sm' | 'md';
    dot?: boolean;
    label?: string;
}

export function Badge({ className, variant, size = "md", dot = false, label, children, ...props }: BadgeProps) {
    let computedVariant = variant || 'default';

    const contentText = label || (typeof children === 'string' ? children : '');
    const textLower = contentText.toLowerCase();

    // Auto-detect variant based on label/children if variant not explicitly provided
    if (!variant && contentText) {
        if (textLower.includes("reliable") || textLower.includes("low") || textLower.includes("paid")) {
            computedVariant = "success";
        } else if (textLower.includes("erratic") || textLower.includes("medium") || textLower.includes("pending")) {
            computedVariant = "warning";
        } else if (textLower.includes("high risk") || textLower.includes("high") || textLower.includes("overdue")) {
            computedVariant = "danger";
        } else if (textLower.includes("cancelled")) {
            computedVariant = "default";
        }
    }

    const baseStyles = "inline-flex items-center rounded-full font-medium transition-colors gap-1.5 whitespace-nowrap";

    const variants = {
        success: "bg-green-500/15 text-green-400 border border-green-500/30",
        warning: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
        danger: "bg-red-500/15 text-red-400 border border-red-500/30",
        info: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
        default: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
    };

    const sizes = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
    };

    return (
        <div className={cn(baseStyles, variants[computedVariant], sizes[size], className)} {...props}>
            {dot && (
                <span className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    computedVariant === 'success' ? 'bg-green-400' :
                        computedVariant === 'warning' ? 'bg-yellow-400' :
                            computedVariant === 'danger' ? 'bg-red-400' :
                                computedVariant === 'info' ? 'bg-blue-400' : 'bg-slate-400'
                )} />
            )}
            {label || children}
        </div>
    )
}

export default Badge;
