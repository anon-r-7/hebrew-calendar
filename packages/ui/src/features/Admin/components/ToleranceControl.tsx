import React from 'react'
import { Flex, Text } from '@chakra-ui/react'

/**
 * 0 · ±1 · ±2 · ±3 — "only": the view shows hits that miss a clean value by exactly that many
 * days (±1 also catches half-days, ±2 catches 1¼–2, ±3 catches 2¼–3); 0 is exact hits only.
 */
export const ToleranceControl = ({ value, onChange, label = 'TOLERANCE' }: { value: number; onChange: (v: number) => void; label?: string }) => (
  <Flex align="center" gap={2}>
    <Text fontSize="11" fontWeight="500" color="brand.textSecondary">
      {label}
    </Text>
    <Flex border="1px solid" borderColor="brand.border" borderRadius="md" overflow="hidden" bg="brand.surfaceRaised">
      {[0, 1, 2, 3].map((t) => (
        <Text
          key={t}
          as="button"
          type="button"
          onClick={() => onChange(t)}
          className="mono"
          fontSize="12px"
          fontWeight="600"
          px={2.5}
          py={1}
          bg={value === t ? 'brand.primary' : 'transparent'}
          color={value === t ? 'brand.onPrimary' : 'brand.textSecondary'}
          _hover={value === t ? undefined : { color: 'brand.text' }}
          title={t ? `only hits that miss by ${t} day${t > 1 ? 's' : ''}` : 'exact hits only'}>
          {t ? `±${t}` : '0'}
        </Text>
      ))}
    </Flex>
  </Flex>
)

/** "exact", "+2d", "−½d" — the signed miss, for a prominent badge */
export const OffsetBadge = ({ offset, size = 'md' }: { offset: number | null | undefined; size?: 'sm' | 'md' }) => {
  if (offset === null || offset === undefined) return null
  const exact = offset === 0
  const v = Math.abs(offset)
  const num = Number.isInteger(v) ? String(v) : v === 0.5 ? '½' : v === 0.25 ? '¼' : v === 0.75 ? '¾' : v.toFixed(2)
  const text = exact ? 'exact' : `${offset > 0 ? '+' : '−'}${num}d`
  return (
    <Text
      as="span"
      className="mono"
      fontSize={size === 'sm' ? '11px' : '13px'}
      fontWeight="700"
      lineHeight="1"
      px={size === 'sm' ? 1.5 : 2}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="md"
      border="1px solid"
      borderColor={exact ? 'brand.success' : 'brand.primary'}
      color={exact ? 'brand.success' : 'brand.primary'}
      bg="transparent"
      whiteSpace="nowrap"
      title={exact ? 'lands exactly on the clean value' : `misses the clean value by ${text}`}>
      {text}
    </Text>
  )
}
