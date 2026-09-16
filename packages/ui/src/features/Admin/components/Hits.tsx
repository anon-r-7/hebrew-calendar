import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'

import { Analysis, Hit } from '@ui/api/admin'

/** signed offset from the clean value, as the engine reports it: "+1d", "−2d", "½d" */
export const offsetLabel = (off: number) => {
  if (!off) return ''
  const sign = off > 0 ? '+' : '−'
  const v = Math.abs(off)
  return `${sign}${Number.isInteger(v) ? v : v.toFixed(v * 4 === Math.round(v * 4) ? 2 : 1)}d`
}

const isStrong = (h: Hit) => h.flags.includes('named') || h.flags.includes('jubilee') || h.flags.includes('named-years')

/** one hit as a chip: label, offset, and the score in small type; named rungs are solid gold */
export const HitChip = ({ hit, compact }: { hit: Hit; compact?: boolean }) => {
  const strong = isStrong(hit)
  return (
    <Flex
      as="span"
      align="baseline"
      gap={1.5}
      px={2}
      py={compact ? 0.5 : 1}
      borderRadius="md"
      border="1px solid"
      borderColor={strong ? 'brand.feastBorder' : 'brand.border'}
      bg={strong ? 'brand.feastBg' : 'brand.surface'}
      color={strong ? 'brand.feastText' : 'brand.text'}
      title={hit.detail || hit.label}
      whiteSpace="nowrap">
      <Text as="span" className="mono" fontSize={compact ? '11px' : '12px'} fontWeight="600" lineHeight="1.4">
        {hit.label}
      </Text>
      {hit.offset ? (
        <Text as="span" className="mono" fontSize="10px" color={strong ? 'brand.feastText' : 'brand.textSecondary'} lineHeight="1.4">
          {offsetLabel(hit.offset)}
        </Text>
      ) : null}
    </Flex>
  )
}

/** the pair's score, sized by how interesting it is */
export const ScoreBadge = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const hot = score >= 8
  const warm = score >= 5.5
  return (
    <Text
      as="span"
      className="mono"
      fontFamily="heading"
      fontWeight="600"
      fontSize={size === 'lg' ? '22px' : size === 'sm' ? '13px' : '16px'}
      lineHeight="1"
      color={hot ? 'brand.primary' : warm ? 'brand.text' : 'brand.textSecondary'}
      title="Interest, 0–10: a whole rung of 8190 is 8 (named +1, whole in both +½, self-similar +½); fractions and classic periods below; year counts only on the same date. Best hit plus a quarter of the second and a tenth of the third.">
      {score.toFixed(1)}
    </Text>
  )
}

/** all hits of an analysis, best first; `max` trims the row */
export const HitRow = ({ analysis, max, compact, mt }: { analysis: Analysis | null | undefined; max?: number; compact?: boolean; mt?: number }) => {
  if (!analysis || !analysis.hits.length) return null
  const hits = max ? analysis.hits.slice(0, max) : analysis.hits
  return (
    <Flex gap={1.5} wrap="wrap" mt={mt}>
      {hits.map((h, i) => (
        <HitChip key={`${h.family}-${h.label}-${i}`} hit={h} compact={compact} />
      ))}
      {max && analysis.hits.length > max ? (
        <Text as="span" fontSize="11px" color="brand.textSecondary" alignSelf="center">
          +{analysis.hits.length - max}
        </Text>
      ) : null}
    </Flex>
  )
}

/** "44 + 1/5 rungs (+1d)" — the span's place on the 8190 ladder, whether or not it is a hit */
export const RungPosition = ({ analysis }: { analysis: Analysis }) => {
  const n = analysis.rung.nearest
  const whole = n ? (n.k ? `${n.k}${n.r ? ` + ${n.r}/${n.d}` : ''}` : `${n.r}/${n.d}`) : ''
  const text = n
    ? `${whole} rung${(n.k === 1 && !n.r) || (!n.k && n.r === 1) ? '' : 's'}${n.offset ? ` ${offsetLabel(n.offset)}` : ''}`
    : `${analysis.rung.value.toFixed(3)} rungs`
  return (
    <Box>
      <Text as="span" className="mono" fontSize="12px" color="brand.text">
        {text}
      </Text>
      <Text as="span" fontSize="10px" color="brand.textSecondary" ml={1.5}>
        of 8190
      </Text>
    </Box>
  )
}
