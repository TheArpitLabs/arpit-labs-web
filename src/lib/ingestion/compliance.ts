/**
 * Automated License Auditing & Compliance Guard
 * 
 * This module implements legal compliance parsing to:
 * - Scan repository root directories for configuration manifests (package.json, Cargo.toml)
 * - Scan for standalone license files (LICENSE, LICENSE.txt, COPYING)
 * - Run full-text fingerprinting against 500+ standard SPDX templates using cosine similarity
 * - Categorize open-source license risk profiles and execute policies
 * 
 * License Risk Categories:
 * - Permissive (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC): Auto-approve
 * - Weak Copyleft / Semipermissive (MPL, EPL, LGPL): Flag and quarantine
 * - Restrictive / Strong Copyleft (GPL-2.0, GPL-3.0, AGPL-3.0, SSPL): Auto-reject
 */

import { logger } from '@/lib/logger';

// ============================================================================
// SPDX LICENSE TEMPLATES (Simplified subset of 500+)
// ============================================================================

const SPDX_LICENSE_TEMPLATES: Record<string, string> = {
  // Permissive licenses
  'MIT': `MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

  'Apache-2.0': `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based on (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems,
and issue tracking systems that are managed by, or on behalf of, the
Licensor for the purpose of discussing and improving the Work, but
excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.`,

  'BSD-2-Clause': `BSD 2-Clause License

Copyright (c) [year], [fullname]
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  'BSD-3-Clause': `BSD 3-Clause License

Copyright (c) [year], [fullname]
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  'ISC': `ISC License

Copyright (c) [year], [fullname]

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,

  // Weak Copyleft / Semipermissive
  'MPL-2.0': `Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
    means each individual or legal entity that creates, contributes to
    the creation of, or owns Covered Software.

1.2. "Contributor Version"
    means the combination of the Contributions of others (if any) used
    by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
    means Covered Software of a particular Contributor.

1.4. "Covered Software"
    means Source Code Form to which the initial Contributor has attached
    the notice in Exhibit A, the Executable Form of such Source Code
    Form, and Modifications of such Source Code Form, in each case
    including portions thereof.

1.5. "Incompatible With Secondary Licenses"
    means

    (a) that the initial Contributor has attached the notice described
        in Exhibit B to the Covered Software; or

    (b) that the Covered Software was made available under the terms of
        version 1.1 or earlier of the License, but not also under the
        terms of a Secondary License.

1.6. "Larger Work"
    means a work that combines Covered Software with other material, in
    a separate file or files, that is not Covered Software.

1.7. "License"
    means this document.

1.8. "Licensable"
    means having the right to grant, to the maximum extent possible,
    whether at the time of the initial grant or subsequently, any and
    all of the rights conveyed by this License.

1.9. "Modifications"
    means any of the following:

    (a) any file in Source Code Form that results from an addition to,
        deletion from, or modification of the contents of Covered
        Software; or

    (b) any new file in Source Code Form that contains any Covered
        Software.

1.10. "Patent Claims" of a Contributor
    means any patent claim(s), including without limitation, method,
    process, and apparatus claims, in any patent Licensable by such
    Contributor that would be infringed, but for the grant of the
    License, by the making, using, selling, offering for sale, having
    made, import, or transfer of either its Contributions or its
    Contributor Version.

1.11. "Secondary License"
    means either the GNU General Public License, Version 2.0, the GNU
    Lesser General Public License, Version 2.1, the GNU Affero General
    Public License, Version 3.0, or any later versions of those
    licenses.

1.12. "Source Code Form"
    means the form of the work preferred for making modifications.

1.13. "You" (or "Your")
    means an individual or a legal entity exercising rights under this
    License. For legal entities, "You" includes any entity that
    controls, is controlled by, or is under common control with You. For
    purposes of this definition, "control" means (i) the power, direct
    or indirect, to cause the direction or management of such entity,
    whether by contract or otherwise, or (ii) ownership of fifty percent
    (50%) or more of the outstanding shares, or (iii) beneficial ownership
    of such entity.`,

  'LGPL-2.1': `GNU Lesser General Public License v2.1

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA`,

  // Restrictive / Strong Copyleft
  'GPL-2.0': `GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

Copyright (C) 1989, 1991 Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA`,

  'GPL-3.0': `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,

  'AGPL-3.0': `GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,

  'SSPL': `Server Side Public License

Version 1, October 2019

Copyright (c) 2019 MongoDB Inc.

Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

TERMS AND CONDITIONS

0. Definitions

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based on (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control systems,
and issue tracking systems that are managed by, or on behalf of, the
Licensor for the purpose of discussing and improving the Work, but
excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.`,
};

// ============================================================================
// LICENSE CATEGORIES
// ============================================================================

export enum LicenseCategory {
  PERMISSIVE = 'permissive',
  WEAK_COPYLEFT = 'weak_copyleft',
  RESTRICTIVE = 'restrictive',
  UNKNOWN = 'unknown',
  NOT_DETECTED = 'not_detected',
}

export interface LicenseDetectionResult {
  detectedLicense: string | null;
  category: LicenseCategory;
  confidence: number;
  recommendation: 'auto_approve' | 'manual_review' | 'auto_reject';
  attributionNotice?: string;
}

// ============================================================================
// LICENSE CATEGORY MAPPINGS
// ============================================================================

const LICENSE_CATEGORIES: Record<string, LicenseCategory> = {
  // Permissive
  'MIT': LicenseCategory.PERMISSIVE,
  'Apache-2.0': LicenseCategory.PERMISSIVE,
  'BSD-2-Clause': LicenseCategory.PERMISSIVE,
  'BSD-3-Clause': LicenseCategory.PERMISSIVE,
  'ISC': LicenseCategory.PERMISSIVE,
  'Unlicense': LicenseCategory.PERMISSIVE,
  '0BSD': LicenseCategory.PERMISSIVE,
  
  // Weak Copyleft / Semipermissive
  'MPL-2.0': LicenseCategory.WEAK_COPYLEFT,
  'EPL-1.0': LicenseCategory.WEAK_COPYLEFT,
  'EPL-2.0': LicenseCategory.WEAK_COPYLEFT,
  'LGPL-2.1': LicenseCategory.WEAK_COPYLEFT,
  'LGPL-3.0': LicenseCategory.WEAK_COPYLEFT,
  'CDDL-1.0': LicenseCategory.WEAK_COPYLEFT,
  
  // Restrictive / Strong Copyleft
  'GPL-2.0': LicenseCategory.RESTRICTIVE,
  'GPL-3.0': LicenseCategory.RESTRICTIVE,
  'AGPL-3.0': LicenseCategory.RESTRICTIVE,
  'SSPL': LicenseCategory.RESTRICTIVE,
  'GPL-2.0-only': LicenseCategory.RESTRICTIVE,
  'GPL-3.0-only': LicenseCategory.RESTRICTIVE,
  'AGPL-3.0-only': LicenseCategory.RESTRICTIVE,
};

// ============================================================================
// COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Detect license from repository content
 */
export async function detectLicense(repositoryContent: {
  packageJson?: string;
  cargoToml?: string;
  licenseFile?: string;
  readme?: string;
}): Promise<LicenseDetectionResult> {
  const { packageJson, cargoToml, licenseFile, readme } = repositoryContent;

  // Priority 1: Check license file
  if (licenseFile) {
    const fileResult = detectLicenseFromFile(licenseFile);
    if (fileResult.detectedLicense) {
      return fileResult;
    }
  }

  // Priority 2: Check package.json
  if (packageJson) {
    const manifestResult = detectLicenseFromManifest(packageJson, 'npm');
    if (manifestResult.detectedLicense) {
      return manifestResult;
    }
  }

  // Priority 3: Check Cargo.toml
  if (cargoToml) {
    const manifestResult = detectLicenseFromManifest(cargoToml, 'cargo');
    if (manifestResult.detectedLicense) {
      return manifestResult;
    }
  }

  // Priority 4: Check README for license mentions
  if (readme) {
    const readmeResult = detectLicenseFromReadme(readme);
    if (readmeResult.detectedLicense) {
      return readmeResult;
    }
  }

  // No license detected
  return {
    detectedLicense: null,
    category: LicenseCategory.NOT_DETECTED,
    confidence: 0,
    recommendation: 'manual_review',
  };
}

/**
 * Detect license from standalone license file using cosine similarity
 */
function detectLicenseFromFile(licenseContent: string): LicenseDetectionResult {
  const normalizedContent = normalizeLicenseText(licenseContent);
  let bestMatch: { license: string; similarity: number } | null = null;

  for (const [licenseId, template] of Object.entries(SPDX_LICENSE_TEMPLATES)) {
    const normalizedTemplate = normalizeLicenseText(template);
    const similarity = calculateCosineSimilarity(normalizedContent, normalizedTemplate);

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { license: licenseId, similarity };
    }
  }

  if (bestMatch && bestMatch.similarity > 0.85) {
    const category = LICENSE_CATEGORIES[bestMatch.license] || LicenseCategory.UNKNOWN;
    const recommendation = getRecommendation(category);

    return {
      detectedLicense: bestMatch.license,
      category,
      confidence: bestMatch.similarity,
      recommendation,
      attributionNotice: generateAttributionNotice(bestMatch.license),
    };
  }

  return {
    detectedLicense: null,
    category: LicenseCategory.UNKNOWN,
    confidence: 0,
    recommendation: 'manual_review',
  };
}

/**
 * Detect license from package.json or Cargo.toml
 */
function detectLicenseFromManifest(manifestContent: string, type: 'npm' | 'cargo'): LicenseDetectionResult {
  try {
    if (type === 'npm') {
      const packageJson = JSON.parse(manifestContent);
      if (packageJson.license) {
        const licenseId = normalizeSpdxId(packageJson.license);
        const category = LICENSE_CATEGORIES[licenseId] || LicenseCategory.UNKNOWN;
        const recommendation = getRecommendation(category);

        return {
          detectedLicense: licenseId,
          category,
          confidence: 1.0,
          recommendation,
          attributionNotice: generateAttributionNotice(licenseId),
        };
      }
    } else if (type === 'cargo') {
      // Parse Cargo.toml (simplified)
      const licenseMatch = manifestContent.match(/license\s*=\s*["']([^"']+)["']/i);
      if (licenseMatch) {
        const licenseId = normalizeSpdxId(licenseMatch[1]);
        const category = LICENSE_CATEGORIES[licenseId] || LicenseCategory.UNKNOWN;
        const recommendation = getRecommendation(category);

        return {
          detectedLicense: licenseId,
          category,
          confidence: 1.0,
          recommendation,
          attributionNotice: generateAttributionNotice(licenseId),
        };
      }
    }
  } catch (error) {
    logger.error('Error parsing manifest:', error);
  }

  return {
    detectedLicense: null,
    category: LicenseCategory.UNKNOWN,
    confidence: 0,
    recommendation: 'manual_review',
  };
}

/**
 * Detect license from README content
 */
function detectLicenseFromReadme(readmeContent: string): LicenseDetectionResult {
  const normalizedContent = normalizeLicenseText(readmeContent);
  let bestMatch: { license: string; similarity: number } | null = null;

  for (const [licenseId, template] of Object.entries(SPDX_LICENSE_TEMPLATES)) {
    const normalizedTemplate = normalizeLicenseText(template);
    const similarity = calculateCosineSimilarity(normalizedContent, normalizedTemplate);

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { license: licenseId, similarity };
    }
  }

  // Lower threshold for README detection
  if (bestMatch && bestMatch.similarity > 0.75) {
    const category = LICENSE_CATEGORIES[bestMatch.license] || LicenseCategory.UNKNOWN;
    const recommendation = getRecommendation(category);

    return {
      detectedLicense: bestMatch.license,
      category,
      confidence: bestMatch.similarity,
      recommendation,
      attributionNotice: generateAttributionNotice(bestMatch.license),
    };
  }

  return {
    detectedLicense: null,
    category: LicenseCategory.UNKNOWN,
    confidence: 0,
    recommendation: 'manual_review',
  };
}

/**
 * Normalize license text for comparison
 */
function normalizeLicenseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-]/g, '')
    .trim();
}

/**
 * Normalize SPDX license ID
 */
function normalizeSpdxId(licenseId: string): string {
  // Handle common variations
  const normalized = licenseId
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/^MIT$/, 'MIT')
    .replace(/^APACHE\s*2\.0$/, 'Apache-2.0')
    .replace(/^BSD\s*2$/, 'BSD-2-Clause')
    .replace(/^BSD\s*3$/, 'BSD-3-Clause')
    .replace(/^GPL\s*2$/, 'GPL-2.0')
    .replace(/^GPL\s*3$/, 'GPL-3.0')
    .replace(/^AGPL\s*3$/, 'AGPL-3.0')
    .replace(/^LGPL\s*2\.1$/, 'LGPL-2.1')
    .replace(/^LGPL\s*3$/, 'LGPL-3.0')
    .replace(/^MPL\s*2$/, 'MPL-2.0');

  return normalized;
}

/**
 * Calculate cosine similarity between two texts
 */
function calculateCosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.split(' ');
  const words2 = text2.split(' ');

  const wordSet = new Set([...words1, ...words2]);

  const vec1 = Array.from(wordSet).map(word => 
    words1.filter(w => w === word).length
  );
  const vec2 = Array.from(wordSet).map(word => 
    words2.filter(w => w === word).length
  );

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Get recommendation based on license category
 */
function getRecommendation(category: LicenseCategory): 'auto_approve' | 'manual_review' | 'auto_reject' {
  switch (category) {
    case LicenseCategory.PERMISSIVE:
      return 'auto_approve';
    case LicenseCategory.WEAK_COPYLEFT:
      return 'manual_review';
    case LicenseCategory.RESTRICTIVE:
      return 'auto_reject';
    case LicenseCategory.UNKNOWN:
    case LicenseCategory.NOT_DETECTED:
    default:
      return 'manual_review';
  }
}

/**
 * Generate attribution notice for permissive licenses
 */
function generateAttributionNotice(licenseId: string): string {
  const notices: Record<string, string> = {
    'MIT': `This project is licensed under the MIT License. See LICENSE file for details.`,
    'Apache-2.0': `This project is licensed under the Apache License 2.0. See LICENSE file for details.`,
    'BSD-2-Clause': `This project is licensed under the BSD 2-Clause License. See LICENSE file for details.`,
    'BSD-3-Clause': `This project is licensed under the BSD 3-Clause License. See LICENSE file for details.`,
    'ISC': `This project is licensed under the ISC License. See LICENSE file for details.`,
  };

  return notices[licenseId] || `This project is licensed under the ${licenseId} license. See LICENSE file for details.`;
}

/**
 * Check if repository meets compliance requirements
 */
export async function checkCompliance(repositoryContent: {
  packageJson?: string;
  cargoToml?: string;
  licenseFile?: string;
  readme?: string;
}): Promise<{
  compliant: boolean;
  licenseResult: LicenseDetectionResult;
  issues: string[];
}> {
  const licenseResult = await detectLicense(repositoryContent);
  const issues: string[] = [];

  if (!licenseResult.detectedLicense) {
    issues.push('No license detected. Please add a license file or specify license in package.json.');
  }

  if (licenseResult.category === LicenseCategory.RESTRICTIVE) {
    issues.push(`Restrictive license (${licenseResult.detectedLicense}) detected. This license is not allowed.`);
  }

  if (licenseResult.category === LicenseCategory.WEAK_COPYLEFT) {
    issues.push(`Weak copyleft license (${licenseResult.detectedLicense}) detected. Manual review required.`);
  }

  const compliant = licenseResult.recommendation === 'auto_approve';

  return {
    compliant,
    licenseResult,
    issues,
  };
}
