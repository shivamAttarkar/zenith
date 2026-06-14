import { cva } from "class-variance-authority";

export const buttonVariants = {
  variant: {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    neutral: "btn-neutral",
    ghost: "btn-ghost",
    info: "btn-info",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
  },
  style: {
    default: "",
    outline: "btn-outline",
    soft: "btn-soft",
    dash: "btn-dash",
  },
  shape: {
    default: "",
    square: "btn-square",
    circle: "btn-circle",
  },
  width: {
    fill: "btn-block",
    hug: "",
  },
  size: {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
    xl: "btn-xl",
  },
};

export const buttonCVA = cva("btn", {
  variants: buttonVariants,
  defaultVariants: {
    variant: "primary",
    style: "default",
    shape: "default",
    size: "md",
    width: "hug",
  },
});
