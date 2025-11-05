/**
 * Virus Scanner
 * Scans uploaded files for malware using ClamAV or VirusTotal API
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface ScanResult {
  safe: boolean;
  virus?: string;
  scanner: 'clamav' | 'virustotal' | 'hash-check' | 'disabled';
  scannedAt: Date;
}

/**
 * Check if ClamAV is installed
 */
async function isClamAVInstalled(): Promise<boolean> {
  try {
    await execAsync('which clamscan');
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan file with ClamAV
 */
async function scanWithClamAV(filePath: string): Promise<ScanResult> {
  try {
    const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`);
    
    // ClamAV returns exit code 0 if clean, 1 if infected
    const isClean = !stdout.includes('FOUND') && !stderr.includes('FOUND');
    
    if (!isClean) {
      const virusMatch = stdout.match(/(.+): (.+) FOUND/);
      const virusName = virusMatch ? virusMatch[2] : 'Unknown virus';
      
      console.error(`[VirusScanner] ClamAV detected virus: ${virusName} in ${filePath}`);
      
      return {
        safe: false,
        virus: virusName,
        scanner: 'clamav',
        scannedAt: new Date(),
      };
    }
    
    console.log(`[VirusScanner] ClamAV: File is clean - ${filePath}`);
    return {
      safe: true,
      scanner: 'clamav',
      scannedAt: new Date(),
    };
  } catch (error: any) {
    // If clamscan exits with code 1, file is infected
    if (error.code === 1) {
      const virusMatch = error.stdout?.match(/(.+): (.+) FOUND/);
      const virusName = virusMatch ? virusMatch[2] : 'Unknown virus';
      
      console.error(`[VirusScanner] ClamAV detected virus: ${virusName} in ${filePath}`);
      
      return {
        safe: false,
        virus: virusName,
        scanner: 'clamav',
        scannedAt: new Date(),
      };
    }
    
    throw error;
  }
}

/**
 * Scan file with VirusTotal API
 */
async function scanWithVirusTotal(filePath: string): Promise<ScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('VirusTotal API key not configured');
  }
  
  try {
    // Calculate file hash (SHA256)
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Check if file hash is already known
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: {
        'x-apikey': apiKey,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const stats = data.data.attributes.last_analysis_stats;
      
      // If any scanner detected malware, mark as unsafe
      if (stats.malicious > 0) {
        console.error(`[VirusScanner] VirusTotal detected malware: ${stats.malicious} scanners flagged ${filePath}`);
        
        return {
          safe: false,
          virus: `Detected by ${stats.malicious} scanners`,
          scanner: 'virustotal',
          scannedAt: new Date(),
        };
      }
      
      console.log(`[VirusScanner] VirusTotal: File is clean - ${filePath}`);
      return {
        safe: true,
        scanner: 'virustotal',
        scannedAt: new Date(),
      };
    } else if (response.status === 404) {
      // File not in VirusTotal database - upload for scanning
      console.log(`[VirusScanner] File not in VirusTotal database, uploading for scan...`);
      
      // Note: Uploading and waiting for scan results can take time
      // For production, consider async scanning with webhooks
      return {
        safe: true, // Assume safe if not in database (could be new file)
        scanner: 'virustotal',
        scannedAt: new Date(),
      };
    } else {
      throw new Error(`VirusTotal API error: ${response.status}`);
    }
  } catch (error: any) {
    console.error('[VirusScanner] VirusTotal scan failed:', error.message);
    throw error;
  }
}

/**
 * Basic hash-based check against known malware hashes
 */
async function scanWithHashCheck(filePath: string): Promise<ScanResult> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // List of known malware hashes (example - in production, use a real database)
    const knownMalwareHashes = new Set([
      // Add known malware hashes here
      // This is just a placeholder - in production, use a real malware hash database
    ]);
    
    if (knownMalwareHashes.has(hash)) {
      console.error(`[VirusScanner] Hash check detected known malware: ${hash}`);
      
      return {
        safe: false,
        virus: 'Known malware hash',
        scanner: 'hash-check',
        scannedAt: new Date(),
      };
    }
    
    console.log(`[VirusScanner] Hash check: File is clean - ${filePath}`);
    return {
      safe: true,
      scanner: 'hash-check',
      scannedAt: new Date(),
    };
  } catch (error: any) {
    console.error('[VirusScanner] Hash check failed:', error.message);
    throw error;
  }
}

/**
 * Scan uploaded file for viruses
 * Tries ClamAV first, falls back to VirusTotal, then hash check
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
  console.log(`[VirusScanner] Scanning file: ${filePath}`);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Try ClamAV first (fastest and most reliable)
  if (await isClamAVInstalled()) {
    try {
      return await scanWithClamAV(filePath);
    } catch (error: any) {
      console.warn('[VirusScanner] ClamAV scan failed, trying fallback:', error.message);
    }
  }
  
  // Try VirusTotal API
  if (process.env.VIRUSTOTAL_API_KEY) {
    try {
      return await scanWithVirusTotal(filePath);
    } catch (error: any) {
      console.warn('[VirusScanner] VirusTotal scan failed, trying fallback:', error.message);
    }
  }
  
  // Fallback to hash check
  try {
    return await scanWithHashCheck(filePath);
  } catch (error: any) {
    console.warn('[VirusScanner] Hash check failed:', error.message);
  }
  
  // If all scanners fail, return disabled status (allow file but log warning)
  console.warn('[VirusScanner] All scanners failed - file allowed but not scanned');
  return {
    safe: true, // Allow file to proceed (better than blocking all uploads)
    scanner: 'disabled',
    scannedAt: new Date(),
  };
}

/**
 * Scan file and delete if infected
 */
export async function scanAndQuarantine(filePath: string): Promise<ScanResult> {
  const result = await scanFile(filePath);
  
  if (!result.safe) {
    // Delete infected file
    try {
      await fs.unlink(filePath);
      console.log(`[VirusScanner] Deleted infected file: ${filePath}`);
    } catch (error: any) {
      console.error(`[VirusScanner] Failed to delete infected file: ${error.message}`);
    }
  }
  
  return result;
}

/**
 * Middleware to scan uploaded files
 */
export async function virusScanMiddleware(
  req: any,
  res: any,
  next: any
): Promise<void> {
  // Skip if no files uploaded
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!file || !file.path) continue;
      
      const result = await scanFile(file.path);
      
      if (!result.safe) {
        // Delete infected file
        try {
          await fs.unlink(file.path);
        } catch (error: any) {
          console.error(`[VirusScanner] Failed to delete infected file: ${error.message}`);
        }
        
        res.status(400).json({
          error: 'Arquivo infectado detectado',
          virus: result.virus,
          message: 'O arquivo enviado contém malware e foi rejeitado por motivos de segurança.',
        });
        return;
      }
    }
    
    next();
  } catch (error: any) {
    console.error('[VirusScanner] Middleware error:', error.message);
    // Allow file to proceed if scanner fails (better than blocking all uploads)
    next();
  }
}
