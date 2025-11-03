"""
Manus AI - Report Generation Assistant
=======================================
AI-powered technical report generation following mining industry standards
"""

from openai import AsyncOpenAI
from typing import Dict, List, Optional, Any
import os
import json
from datetime import datetime, timezone


class ManusEngine:
    """
    Manus AI - Report Generation Assistant
    
    Generates AI-powered technical reports for mining projects
    following JORC, NI 43-101, and PRMS standards.
    
    Features:
    - Template-based generation (JORC 2012, NI 43-101, PRMS)
    - GPT-4o content generation
    - Quality control validation
    - Section management
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Manus Engine
        
        Args:
            api_key: OpenAI API key (uses OPENAI_API_KEY env var if not provided)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Dict]:
        """Load template configurations"""
        return {
            'jorc_2012': {
                'name': 'JORC Code 2012',
                'full_name': 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves (2012 Edition)',
                'sections': [
                    'Summary',
                    'Introduction',
                    'Geology and Geological Interpretation',
                    'Sampling and Sub-sampling',
                    'Sample Analysis and Security',
                    'Estimation and Reporting of Mineral Resources',
                    'Estimation and Reporting of Ore Reserves',
                    'Mining Methods',
                    'Processing and Metallurgical Testwork',
                    'Infrastructure',
                    'Costs',
                    'Revenue Factors',
                    'Market Assessment',
                    'Environmental Studies',
                    'Social and Community',
                    'Permitting and Legal',
                    'Economic Analysis',
                    'Risks and Opportunities',
                    'Conclusions and Recommendations'
                ],
                'standard': 'JORC',
                'year': 2012,
                'jurisdiction': 'Australia'
            },
            'ni_43_101': {
                'name': 'NI 43-101 Technical Report',
                'full_name': 'National Instrument 43-101 Standards of Disclosure for Mineral Projects',
                'sections': [
                    'Title Page',
                    'Table of Contents',
                    'Summary',
                    'Introduction and Terms of Reference',
                    'Reliance on Other Experts',
                    'Property Description and Location',
                    'Accessibility, Climate, Local Resources, Infrastructure',
                    'History',
                    'Geological Setting and Mineralization',
                    'Deposit Types',
                    'Exploration',
                    'Drilling',
                    'Sample Preparation, Analyses and Security',
                    'Data Verification',
                    'Mineral Processing and Metallurgical Testing',
                    'Mineral Resource Estimates',
                    'Mineral Reserve Estimates',
                    'Mining Methods',
                    'Recovery Methods',
                    'Project Infrastructure',
                    'Market Studies',
                    'Environmental Studies, Permitting, Social/Community Impact',
                    'Capital and Operating Costs',
                    'Economic Analysis',
                    'Adjacent Properties',
                    'Other Relevant Data and Information',
                    'Interpretation and Conclusions',
                    'Recommendations',
                    'References',
                    'Certificates'
                ],
                'standard': 'NI 43-101',
                'jurisdiction': 'Canada',
                'exchange': 'TSX'
            },
            'prms': {
                'name': 'PRMS Executive Summary',
                'full_name': 'Petroleum Resources Management System',
                'sections': [
                    'Overview',
                    'Resources Summary',
                    'Reserves Summary',
                    'Economic Analysis',
                    'Key Assumptions',
                    'Risks and Uncertainties',
                    'Recommendations'
                ],
                'standard': 'PRMS',
                'jurisdiction': 'International',
                'focus': 'Petroleum'
            }
        }
    
    async def generate_report(
        self,
        template: str,
        project_data: Dict[str, Any],
        format: str = 'json'
    ) -> Dict[str, Any]:
        """
        Generate complete report from template
        
        Args:
            template: Template name (jorc_2012, ni_43_101, prms)
            project_data: Project information and data
            format: Output format (json, text, html)
            
        Returns:
            Generated report with metadata
        """
        try:
            if template not in self.templates:
                return {
                    'status': 'error',
                    'message': f"Unknown template: {template}. Available: {list(self.templates.keys())}",
                    'timestamp': self._get_timestamp()
                }
            
            if not self.client:
                return {
                    'status': 'error',
                    'message': 'OpenAI API key not configured',
                    'timestamp': self._get_timestamp()
                }
            
            template_config = self.templates[template]
            sections = []
            
            # Generate each section
            for section_name in template_config['sections']:
                try:
                    content = await self.generate_section(
                        section_name=section_name,
                        template=template,
                        project_data=project_data
                    )
                    sections.append({
                        'name': section_name,
                        'content': content,
                        'word_count': len(content.split())
                    })
                except Exception as e:
                    sections.append({
                        'name': section_name,
                        'content': f"[Error generating section: {str(e)}]",
                        'error': str(e)
                    })
            
            # Assemble report
            report_content = self._assemble_report(sections, template_config)
            
            # Quality check
            quality = await self.validate_report(report_content, template)
            
            return {
                'status': 'success',
                'template': template,
                'template_name': template_config['name'],
                'sections': len(sections),
                'sections_data': sections if format == 'json' else None,
                'content': report_content if format in ['text', 'html'] else None,
                'quality': quality,
                'metadata': {
                    'project': project_data.get('project_name', 'Unknown'),
                    'generated_at': self._get_timestamp(),
                    'format': format,
                    'total_words': sum(s.get('word_count', 0) for s in sections)
                },
                'timestamp': self._get_timestamp()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def generate_section(
        self,
        section_name: str,
        template: str,
        project_data: Dict[str, Any]
    ) -> str:
        """
        Generate single section with GPT-4o
        
        Args:
            section_name: Name of section to generate
            template: Template name
            project_data: Project information
            
        Returns:
            Generated section content
        """
        if not self.client:
            raise ValueError("OpenAI API key not configured")
        
        if template not in self.templates:
            raise ValueError(f"Unknown template: {template}")
        
        prompt = self._build_section_prompt(
            section_name=section_name,
            template=template,
            project_data=project_data
        )
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert technical report writer specializing in mining industry standards (JORC, NI 43-101, PRMS).

Your writing style:
- Professional and technical
- Clear and concise
- Evidence-based with data citations
- Compliant with regulatory requirements
- Includes limitations and assumptions
- Uses proper mining terminology"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,  # Lower for more consistent technical writing
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    
    def _build_section_prompt(
        self,
        section_name: str,
        template: str,
        project_data: Dict[str, Any]
    ) -> str:
        """Build GPT prompt for section generation"""
        
        template_config = self.templates[template]
        
        # Extract relevant data for this section
        section_data = project_data.get('data', {}).get(section_name.lower().replace(' ', '_'), {})
        
        return f"""
Generate the '{section_name}' section for a {template_config['name']} technical report.

STANDARD: {template_config['standard']} ({template_config.get('year', 'Latest')})
JURISDICTION: {template_config.get('jurisdiction', 'International')}

PROJECT INFORMATION:
Project Name: {project_data.get('project_name', 'N/A')}
Commodity: {project_data.get('commodity', 'N/A')}
Location: {project_data.get('location', 'N/A')}

SECTION-SPECIFIC DATA:
{json.dumps(section_data, indent=2) if section_data else 'No specific data provided - generate template content'}

GENERAL PROJECT DATA:
{json.dumps(project_data.get('data', {}), indent=2)[:1000]}...

REQUIREMENTS:
1. Follow {template_config['standard']} standard requirements for this section
2. Include all material factors relevant to this section
3. Use professional technical language appropriate for regulatory filing
4. Cite data sources and provide references
5. Include limitations, assumptions, and uncertainties
6. Provide quantitative data where available
7. Maintain consistency with other sections
8. Address competent person requirements if applicable

FORMATTING:
- Length: 500-1000 words (adjust based on section importance)
- Style: Professional technical report
- Include subsections if appropriate
- Use bullet points for lists
- Reference tables/figures if applicable
- Include disclaimers if required

Generate the section content now, following {template_config['standard']} guidelines:
"""
    
    def _assemble_report(
        self,
        sections: List[Dict],
        template_config: Dict
    ) -> str:
        """Assemble sections into complete report"""
        
        report_lines = [
            "=" * 80,
            f"{template_config['full_name']}".center(80),
            "=" * 80,
            "",
            f"Generated by Manus AI - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "=" * 80,
            ""
        ]
        
        for idx, section in enumerate(sections, 1):
            report_lines.extend([
                "",
                f"{idx}. {section['name']}",
                "-" * 80,
                "",
                section['content'],
                ""
            ])
        
        return "\n".join(report_lines)
    
    async def validate_report(
        self,
        content: str,
        template: str
    ) -> Dict[str, Any]:
        """
        Quality control validation
        
        Args:
            content: Report content to validate
            template: Template name
            
        Returns:
            Validation results with quality score
        """
        if not self.client:
            return {
                'score': 0,
                'status': 'error',
                'message': 'OpenAI API not configured'
            }
        
        template_config = self.templates[template]
        
        # Basic checks
        word_count = len(content.split())
        section_count = content.count('\n\n')
        
        # AI quality check
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a quality control expert for {template_config['standard']} technical reports."
                    },
                    {
                        "role": "user",
                        "content": f"""
Review this technical report for compliance with {template_config['standard']} standards.

Report excerpt (first 2000 chars):
{content[:2000]}

Evaluate:
1. Compliance with {template_config['standard']} requirements (0-100)
2. Technical quality and clarity (0-100)
3. Completeness of information (0-100)
4. Professional presentation (0-100)

Respond with JSON:
{{
    "compliance_score": <number>,
    "technical_quality": <number>,
    "completeness": <number>,
    "presentation": <number>,
    "issues": ["issue 1", "issue 2"],
    "recommendations": ["rec 1", "rec 2"]
}}
"""
                    }
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            ai_review = json.loads(response.choices[0].message.content)
            
            # Calculate overall score
            overall_score = (
                ai_review['compliance_score'] * 0.4 +
                ai_review['technical_quality'] * 0.3 +
                ai_review['completeness'] * 0.2 +
                ai_review['presentation'] * 0.1
            )
            
            return {
                'score': round(overall_score, 1),
                'status': 'pass' if overall_score >= 70 else 'review',
                'breakdown': ai_review,
                'statistics': {
                    'word_count': word_count,
                    'section_count': section_count,
                    'pages_estimate': word_count // 300
                }
            }
        
        except Exception as e:
            # Fallback to basic validation
            return {
                'score': 75,  # Conservative estimate
                'status': 'review',
                'message': f'AI validation failed: {str(e)}',
                'statistics': {
                    'word_count': word_count,
                    'section_count': section_count,
                    'pages_estimate': word_count // 300
                }
            }
    
    def get_templates(self) -> List[Dict]:
        """
        List available report templates
        
        Returns:
            List of template configurations
        """
        return [
            {
                'id': key,
                'name': config['name'],
                'full_name': config['full_name'],
                'standard': config['standard'],
                'sections': len(config['sections']),
                'jurisdiction': config.get('jurisdiction', 'International')
            }
            for key, config in self.templates.items()
        ]
    
    def get_template_sections(self, template: str) -> List[str]:
        """
        Get sections for a specific template
        
        Args:
            template: Template name
            
        Returns:
            List of section names
        """
        if template not in self.templates:
            return []
        
        return self.templates[template]['sections']
    
    def _get_timestamp(self) -> str:
        """Return ISO 8601 timestamp"""
        return datetime.now(timezone.utc).isoformat()


# Singleton instance
_manus_instance = None

def get_manus_engine() -> ManusEngine:
    """Get or create Manus Engine singleton"""
    global _manus_instance
    if _manus_instance is None:
        _manus_instance = ManusEngine()
    return _manus_instance
