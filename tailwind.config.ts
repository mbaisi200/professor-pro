import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
	  		colors: {
	  			background: 'hsl(var(--background))',
	  			foreground: 'hsl(var(--foreground))',
	  			card: {
	  				DEFAULT: 'hsl(var(--card))',
	  				foreground: 'hsl(var(--card-foreground))'
	  			},
	  			popover: {
	  				DEFAULT: 'hsl(var(--popover))',
	  				foreground: 'hsl(var(--popover-foreground))'
	  			},
	  			primary: {
	  				DEFAULT: 'hsl(var(--primary))',
	  				foreground: 'hsl(var(--primary-foreground))'
	  			},
	  			secondary: {
	  				DEFAULT: 'hsl(var(--secondary))',
	  				foreground: 'hsl(var(--secondary-foreground))'
	  			},
	  			muted: {
	  				DEFAULT: 'hsl(var(--muted))',
	  				foreground: 'hsl(var(--muted-foreground))'
	  			},
	  			accent: {
	  				DEFAULT: 'hsl(var(--accent))',
	  				foreground: 'hsl(var(--accent-foreground))'
	  			},
	  			destructive: {
	  				DEFAULT: 'hsl(var(--destructive))',
	  				foreground: 'hsl(var(--destructive-foreground))'
	  			},
	  			border: 'hsl(var(--border))',
	  			input: 'hsl(var(--input))',
	  			ring: 'hsl(var(--ring))',
	  			chart: {
	  				'1': 'hsl(var(--chart-1))',
	  				'2': 'hsl(var(--chart-2))',
	  				'3': 'hsl(var(--chart-3))',
	  				'4': 'hsl(var(--chart-4))',
	  				'5': 'hsl(var(--chart-5))'
	  			}
	  		},
	  		borderRadius: {
	  			lg: 'var(--radius)',
	  			md: 'calc(var(--radius) - 2px)',
	  			sm: 'calc(var(--radius) - 4px)'
	  		},
        keyframes: {
          'glass-shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
          },
          'float-slow': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-8px)' }
          },
          'float-medium': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-6px)' }
          },
          'float-fast': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-4px)' }
          },
          'pulse-soft': {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.8' }
          },
          'scale-in': {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' }
          },
          'fade-up': {
            '0%': { transform: 'translateY(20px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          'fade-down': {
            '0%': { transform: 'translateY(-20px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          }
        },
        animation: {
          'glass-shimmer': 'glass-shimmer 3s ease infinite',
          'float-slow': 'float-slow 6s ease-in-out infinite',
          'float-medium': 'float-medium 4s ease-in-out infinite',
          'float-fast': 'float-fast 2s ease-in-out infinite',
          'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
          'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          'fade-up': 'fade-up 0.4s ease-out',
          'fade-down': 'fade-down 0.4s ease-out'
        }
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;