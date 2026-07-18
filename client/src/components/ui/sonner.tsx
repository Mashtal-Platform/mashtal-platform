import { Toaster as Sonner, ToasterProps } from "sonner";
import type { CSSProperties } from "react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      duration={5000}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#171717",
          "--normal-border": "#e5e5e5",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "border border-neutral-200 shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-neutral-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
