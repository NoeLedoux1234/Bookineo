'use client';

import { useCart } from '@/hooks/useCart';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AddToCartButtonProps {
  bookId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'icon';
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  bookId,
  size = 'md',
  variant = 'primary',
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inCart = isInCart(bookId);

  const handleClick = async () => {
    // Rediriger vers login si pas connecté
    if (!session) {
      router.push('/login');
      return;
    }

    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      if (inCart) {
        // Retirer du panier
        const success = await removeFromCart(bookId);
        if (success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      } else {
        // Ajouter au panier
        const success = await addToCart(bookId);
        if (success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Classes pour les différentes tailles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Classes pour les variants
  const variantClasses = {
    primary: inCart
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: inCart
      ? 'border-2 border-green-600 text-green-600 hover:bg-green-50'
      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    icon: inCart
      ? 'bg-green-100 text-green-600 hover:bg-green-200'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${inCart ? 'focus:ring-green-500' : 'focus:ring-blue-500'}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={baseClasses}
        title={inCart ? 'Retirer du panier' : 'Ajouter au panier'}
      >
        {isProcessing ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : showSuccess ? (
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : inCart ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={baseClasses}
    >
      {isProcessing ? (
        <>
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {inCart ? 'Suppression...' : 'Ajout...'}
        </>
      ) : showSuccess ? (
        <>
          <svg
            className="w-4 h-4 mr-2 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {inCart ? 'Retiré!' : 'Ajouté!'}
        </>
      ) : inCart ? (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Dans le panier
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          Ajouter au panier
        </>
      )}
    </button>
  );
}
