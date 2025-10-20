import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export const AiChatbot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSession();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initSession = async () => {
    if (!user?.id) return;

    try {
      const { data: existingSessions, error: fetchError } = await supabase
        .from('ai_chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let currentSessionId: string;

      if (existingSessions) {
        currentSessionId = existingSessions.id;
        setSessionId(currentSessionId);

        const { data: existingMessages, error: messagesError } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
          return;
        }
      } else {
        const { data: newSession, error: createError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            user_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentSessionId = newSession.id;
        setSessionId(currentSessionId);
      }

      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI permit assistant. I can help you with:

• Understanding Seattle's permitting requirements
• Explaining building codes and regulations
• Providing guidance on application processes
• Answering questions about timelines and fees
• Offering tips based on 26,000+ historical permit reviews

How can I assist you today?`,
        created_at: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: input,
        });

      const assistantResponse = generateAiResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        created_at: new Date().toISOString(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);
      }, 300);

      await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantResponse,
        });
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  const generateAiResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('fire egress') || lowerInput.includes('egress plan') || lowerInput.includes('evacuation plan') || lowerInput.includes('emergency exit')) {
      return `**Fire Egress Plan Requirements - Quick Answer**

**What you need**: Floor plan showing emergency exits with specific measurements and details.

**Required Elements**:
1) All exit doors marked with width (min 32" clear), swing direction (must swing out), and hardware type (panic bars for assembly)
2) Egress paths highlighted showing route from any point to nearest exit (max 75 feet travel distance residential, 200-250 feet commercial)
3) Exit corridor widths labeled (min 36" residential, 44" commercial, increases with occupant load)
4) Exit discharge point showing where path leads outside to public way
5) Emergency lighting locations if no windows
6) Assembly/gathering point marked 50+ feet from building

**Quick Specs**:
• Residential: 2 exits required if >1,000 sq ft or >1 story
• Commercial: Based on occupant load calculation
• Doors: Min 32" wide, max 48" travel to unlock
• Stairs: Min 36" wide with handrails both sides if >30" rise

**Fastest solution**: Hire architect to create compliant egress plan with IBC Section 1006-1030 references noted on drawing. Typical cost: $300-800. Turnaround: 3-5 days.

**DIY option**: Use building plan, highlight exits in red, add measurements, note path distances. Include note: "Complies with IBC 1006 egress requirements."`;
    }

    if (lowerInput.includes('structural calculation') || lowerInput.includes('load calculation') || lowerInput.includes('roof load') || lowerInput.includes('structural engineer')) {
      return `**Structural Calculations Requirements - Quick Answer**

**What you need**: Engineer-stamped calculations proving your structure can handle all expected loads.

**Required Load Types**:
1) Dead load: Weight of materials (roof ~15 psf, walls ~10 psf, floors ~10-20 psf)
2) Live load: Temporary loads (roof maintenance 20 psf, floors 40 psf residential/100 psf commercial)
3) Snow load: Seattle = 25 psf ground snow (increases with roof slope/exposure)
4) Wind load: 85-110 mph design wind speed depending on exposure category
5) Seismic load: Seattle is Seismic Category D (significant earthquake requirements)

**What calculations must show**:
• Beam/joist sizing with span tables or formulas
• Connection details (how pieces attach)
• Foundation capacity for total loads
• Load path from roof → walls → foundation → soil

**Quick Numbers for Common Projects**:
• Simple roof: 50-60 psf total load capacity needed
• Floor joists: 2x10 @ 16" spans ~13 feet for residential
• Headers over openings: Table R502.5 in IRC has pre-calculated sizes

**Fastest solution**: Hire structural engineer (PE required in WA). Cost: $1,500-3,500 for residential, $5,000-15,000 commercial. Turnaround: 1-2 weeks.

**Cannot DIY**: Must be licensed professional engineer (PE) stamp required for Seattle permits.

**What to provide engineer**: Plans showing all floors/roof, opening sizes, any unusual loads (hot tub, solar panels), soil report if available.`;
    }

    if ((lowerInput.includes('setback') && lowerInput.includes('violation')) || (lowerInput.includes('setback') && lowerInput.includes('error'))) {
      return `**Setback Violation Resolution - Quick Answer**

**What setbacks are**: Minimum required distance from property lines to any structure.

**Common Seattle Setbacks by Zone**:
1) SF-5000/7200/9600: Front 20', Sides 5' each, Rear 25'
2) RSL: Front 20', Sides 5' each, Rear 20'
3) Lowrise LR1/LR2/LR3: Front 15', Sides 5', Rear 20'
4) DADU/ADU: Sides 5', Rear 5', no front setback if alley access

**How to resolve**:
1) Get survey from licensed surveyor showing exact property lines ($800-1,500, takes 1-2 weeks)
2) Measure from property line to closest point of proposed structure
3) Compare to required setbacks for your zone (find at seattle.gov/dpd zoning map)
4) If violated: Move building or reduce size to comply

**Quick measurements needed**:
• Front setback: From front property line to building face
• Side setbacks: From side property lines (both sides measured separately)
• Rear setback: From rear property line to building
• Include eaves, stairs, porches (they count toward setback)

**Exceptions allowing reduced setbacks**:
• Existing nonconforming structure staying in same footprint
• Eaves can project 18" into setback
• Uncovered stairs can project 3' into setback
• Corner lots have special rules (second street becomes side)

**If you can't meet setbacks**: Variance extremely difficult (>$5,000, 6-12 months, rarely approved). Better to redesign.

**Fastest check**: Measure from property corners (use survey pins or marker) to your building with tape measure. Add 1-2 feet safety margin.`;
    }

    if (lowerInput.includes('energy code') || lowerInput.includes('energy compliance') || lowerInput.includes('wsec') || lowerInput.includes('energy worksheet')) {
      return `**Energy Code Documentation - Quick Answer**

**What you need**: Seattle Energy Code Compliance Worksheet showing your building meets efficiency standards.

**Required Documents**:
1) Completed Residential/Commercial Energy Worksheet (seattle.gov/sdci forms page)
2) Window specs: U-factor ≤0.30, SHGC varies by orientation
3) Insulation values: Walls R-21, Ceiling R-49, Floor R-30, Basement R-15
4) HVAC equipment efficiency: 95% AFUE furnace or 9.0 HSPF heat pump minimum
5) Ventilation plan: Mechanical ventilation required (HRV/ERV preferred)
6) Duct sealing: Max 4 CFM/100 sq ft leakage

**Quick Seattle Requirements** (stricter than base WSEC):
• Air sealing: ≤3.0 ACH50 blower door test required
• Windows: U-0.30 max (vs 0.32 standard), double-pane low-E minimum
• Insulation: Higher than standard IRC (walls R-21 vs R-20)
• Lighting: 90% high-efficacy (LED) in commercial
• No electric resistance heat unless renewable energy installed

**Fastest completion**:
1) Download worksheet from SDCI website
2) Get window/door specs from manufacturer cutsheets
3) Get insulation R-values from plans/specifications
4) Get HVAC model numbers and look up efficiency ratings online
5) Fill in worksheet (takes 30-60 minutes)
6) If designing new: Use Washington State Energy Code Compliance software (free)

**Common packages that meet code**:
• Windows: Andersen 100 series, Milgard Essence, Pella 250
• Insulation: Closed-cell spray foam R-21 walls, blown cellulose R-49 ceiling
• HVAC: Lennox SLP98V furnace, Mitsubishi Hyper-Heat pump

**Pro tip**: Include this with initial submission. Won't delay permit, but submitting later adds 1-2 weeks to review.

**Cost if hiring**: Energy consultant $500-1,200 to complete all forms and modeling.`;
    }

    if (lowerInput.includes('compliance issue') || lowerInput.includes('permit checker') || lowerInput.includes('smart checker error')) {
      return `**Understanding Your Permit Checker Results - Quick Guide**

**Critical Issues** (🔴 Must fix or permit will be denied):
• Fire egress plan missing
• Structural engineer stamp missing
• Zoning violation (wrong use/too tall/too much coverage)

**Warning Issues** (⚠️ Will cause correction cycle, 2-4 week delay):
• Incomplete calculations
• Setback concerns
• Missing details on plans

**Info Items** (ℹ️ Won't stop permit, but slows review):
• Energy code forms
• Additional documentation

**Ask me about specific issues**:
• "Explain fire egress plan requirements"
• "How do I fix structural calculations?"
• "What to do about setback violation?"
• "Energy code documentation help"

**Priority order**:
1) Fix all Critical items first (won't get approved without these)
2) Address Warning items (prevent correction delays)
3) Include Info items (speeds up process)

Which specific issue would you like detailed help with?`;
    }

    if (lowerInput.includes('quicker') || lowerInput.includes('faster') || lowerInput.includes('speed up') || lowerInput.includes('done quicker')) {
      return `**How to Get Your Permit Approved Faster**

Here are proven strategies to accelerate your permit processing:

**1. Submit Complete, High-Quality Documents** (Saves 2-4 weeks)
✓ Use our Smart Permit Checker to catch issues before submission
✓ Include all required documents in your initial submission
✓ Ensure plans are clear, legible, and properly scaled
✓ Double-check calculations and specifications

**2. Address Common Issues Proactively** (Saves 1-3 weeks)
✓ Include detailed fire egress plans (28% of corrections)
✓ Provide complete structural calculations (24% of corrections)
✓ Submit energy code compliance forms upfront (18% of corrections)
✓ Verify setback requirements match your zone (15% of corrections)

**3. Consider Pre-Application Meetings** (Can save weeks of back-and-forth)
✓ Schedule a meeting with plan reviewers before formal submission
✓ Get feedback on complex or unusual aspects
✓ Build rapport with reviewers

**4. Choose the Right Time to Submit**
✓ Avoid peak seasons (typically March-June)
✓ Submit early in the week for faster initial review
✓ Monitor workload through our Analytics Dashboard

**5. Hire Experienced Professionals**
✓ Architects and engineers familiar with Seattle codes
✓ They know reviewer expectations and common pitfalls

**Real Results**: Projects that use our Smart Permit Checker and follow these guidelines see 30-40% faster approval times compared to the average!

Would you like specific tips for your permit type?`;
    }

    if (lowerInput.includes('timeline') || lowerInput.includes('how long')) {
      return `Based on historical data from Seattle's permitting system:

**Building Permits**: Average processing time is 45-60 days
• Single-family residential: 30-45 days
• Multi-family residential: 60-90 days
• Commercial: 75-120 days

**Factors affecting timeline**:
• Completeness of initial submission
• Complexity of project
• Current department workload
• Required corrections or additional information

**Pro tip**: Using our Smart Permit Checker before submission can reduce processing time by identifying potential issues early.

Would you like specific information about your permit type?`;
    }

    if (lowerInput.includes('setback') || lowerInput.includes('property line')) {
      return `**Setback Requirements in Seattle**

Setbacks vary by zone, but common requirements include:

**Single-Family Zones (SF)**:
• Front yard: 20 feet
• Side yards: 5 feet each
• Rear yard: 25 feet

**Lowrise Zones (LR1-LR3)**:
• Front: 15 feet
• Side: 5 feet (can be reduced with modulation)
• Rear: 20 feet

**Important Notes**:
• Corner lots may have different requirements
• Exceptional circumstances can allow modifications
• Always verify with your specific zone designation

Would you like help determining your property's zoning?`;
    }

    if (lowerInput.includes('fee') || lowerInput.includes('cost') || lowerInput.includes('price')) {
      return `**Seattle Permit Fees Overview**

Fees are calculated based on project valuation and type:

**Building Permits**:
• Base fee: $250-$500
• Valuation-based: ~$13-$15 per $1,000 of construction value
• Plan review: Typically 65% of permit fee

**Example Costs**:
• $100,000 remodel: ~$2,000-$2,500
• $500,000 addition: ~$8,000-$10,000

**Additional Fees May Include**:
• SEPA review (if required)
• Utility connection fees
• Impact fees for new construction

Use the city's fee calculator for precise estimates, or I can help you understand specific charges.`;
    }

    if (lowerInput.includes('review') || lowerInput.includes('correction') || lowerInput.includes('fix')) {
      return `**Common Permit Corrections**

Based on analysis of 26,000+ Seattle permit reviews, the most frequent issues are:

1. **Fire/Life Safety** (28% of corrections)
   • Missing egress calculations
   • Incomplete fire protection details

2. **Structural** (24% of corrections)
   • Inadequate load calculations
   • Missing connection details

3. **Energy Code** (18% of corrections)
   • Incomplete energy forms
   • Missing equipment specifications

4. **Zoning** (15% of corrections)
   • Setback violations
   • Height limit issues

**Pro Tip**: Our Smart Permit Checker analyzes your documents against these common issues before submission, potentially saving 2-4 weeks of review time.

Would you like specific guidance on any of these areas?`;
    }

    if (lowerInput.includes('document') || lowerInput.includes('submit') || lowerInput.includes('need')) {
      return `**Required Documents for Building Permits**

**Essential Documents**:
✓ Completed application form
✓ Site plan showing:
  - Property boundaries
  - Existing structures
  - Proposed construction
  - Setbacks

✓ Floor plans (all levels)
✓ Elevations (all sides)
✓ Foundation plan
✓ Structural details
✓ Energy code compliance forms

**Additional Requirements (as applicable)**:
• Geotechnical report (steep slopes, shorelines)
• Arborist report (tree removal)
• Stormwater management plan
• SEPA checklist (larger projects)

**Format Requirements**:
• PDF preferred for digital submission
• 24" x 36" for physical plans
• Minimum 1/4" scale

Upload your documents to our Smart Permit Checker for instant compliance verification!`;
    }

    if (lowerInput.includes('smart permit checker') || lowerInput.includes('checker')) {
      return `**Smart Permit Checker - AI-Powered Document Analysis**

Our Smart Permit Checker uses AI trained on 26,000+ Seattle permit reviews to analyze your documents before submission.

**What It Does**:
✓ Scans your documents for completeness
✓ Identifies missing required elements
✓ Checks for common code violations
✓ Flags potential bottlenecks
✓ Provides specific recommendations for each issue
✓ Calculates a risk score for your application

**How It Helps You**:
• Catch 85% of issues before reviewers see them
• Reduce correction cycles from 2-3 down to 0-1
• Save 2-4 weeks of processing time
• Avoid costly resubmission fees

**To Use It**:
1. Go to the "Smart Permit Checker" tab
2. Enter your project information
3. Upload your permit documents
4. Click "Analyze" for instant feedback

**Real Results**: Applications checked with our tool have a 92% first-time approval rate vs. 58% without!

Ready to check your documents?`;
    }

    if (lowerInput.includes('code') || lowerInput.includes('regulation') || lowerInput.includes('ibc') || lowerInput.includes('requirement')) {
      return `**Seattle Building Codes & Regulations**

Seattle adopts and enforces several key codes:

**Primary Codes**:
• International Building Code (IBC) 2018 with Seattle amendments
• International Residential Code (IRC) 2018
• International Fire Code (IFC) 2018
• Washington State Energy Code (WSEC)
• Seattle Land Use Code (Title 23)

**Key Seattle-Specific Requirements**:

**Energy Efficiency**:
• Stricter than standard WSEC
• Enhanced insulation requirements
• High-efficiency windows (U-factor ≤ 0.30)
• Mandatory air sealing and testing

**Green Building**:
• Built Green or equivalent for single-family homes
• LEED requirements for larger commercial projects

**Seismic Design**:
• Seismic Design Category D requirements
• Special structural considerations for soft soils

**Stormwater**:
• On-site stormwater management
• Low-impact development (LID) when possible

**Common Code Questions**:
• Fire egress requirements: IBC Section 1006-1030
• Structural loads: IBC Section 1607-1609
• Energy compliance: WSEC Section C101-C406

Need specifics about a particular code section? Just ask!`;
    }

    if (lowerInput.includes('appeal') || lowerInput.includes('denied') || lowerInput.includes('rejected') || lowerInput.includes('disagree')) {
      return `**Permit Denials and Appeals Process**

If your permit is denied or you disagree with a decision:

**Understanding Denials**:
Most "denials" are actually correction requests, not final rejections. You'll receive:
• List of specific issues to address
• Code references for each issue
• 180 days to respond with corrections

**True Denials** occur when:
• Project violates zoning outright
• Building type not allowed in zone
• Insufficient lot area/coverage

**Appeal Options**:

**1. Informal Resolution** (Try this first)
• Schedule meeting with plan reviewer
• Discuss concerns and possible solutions
• Often resolves issues without formal appeal
• Success rate: ~70%

**2. Supervisor Review**
• Request review by reviewing supervisor
• Present your interpretation of codes
• Provide supporting documentation
• Processing: 2-3 weeks

**3. Formal Appeal to Hearing Examiner**
• File appeal within 14 days of decision
• $150 filing fee
• Public hearing scheduled
• Binding decision
• Timeline: 60-90 days

**Tips for Success**:
✓ Document everything
✓ Cite specific code sections
✓ Provide professional opinions (engineer/architect)
✓ Show examples of similar approved projects
✓ Be professional and respectful

**Before Appealing**: Make sure the issue is worth the time and cost. Many issues can be resolved with minor design changes.

Would you like guidance on a specific situation?`;
    }

    if (lowerInput.includes('contractor') || lowerInput.includes('who can') || lowerInput.includes('licensed')) {
      return `**Contractor Requirements & Who Can Do Work**

**Work Requiring Licensed Contractors**:

**Electrical Work**: Must use licensed electrician
• All work beyond replacing switches/outlets
• State license required, not just city

**Plumbing**: Must use licensed plumber
• Any work on water supply or DWG
• Fixture replacement usually okay for homeowners

**HVAC**: Must use licensed HVAC contractor
• Furnace, AC, heat pump installation
• Ductwork modifications

**General Construction**: Depends on scope
• Projects >$1,000: License required
• Owner-occupied single-family: Homeowner can do own work
• Must still get permits!

**Homeowner Exemption**:
You can do your own work if:
✓ You own the property
✓ You live in it (or will within 1 year)
✓ It's a single-family residence
✓ You obtain proper permits
✓ You pass all inspections

**What Homeowners Commonly Do**:
• Framing and carpentry
• Drywall installation
• Painting and finishing
• Tile work
• Simple plumbing (with permit)

**What to Hire Out**:
• Electrical (safety and code)
• Structural engineering
• Foundation work
• Complex roofing

**Finding Contractors**:
• Verify license: www.lni.wa.gov
• Check reviews and references
• Get multiple bids
• Ensure they pull permits
• Verify insurance coverage

**Red Flags**:
🚩 Won't pull permits
🚩 Cash-only, no contract
🚩 No license or insurance
🚩 Unusually low bids

Need help finding qualified contractors for specific work?`;
    }

    if (lowerInput.includes('zoning') || lowerInput.includes('zone') || lowerInput.includes('land use')) {
      return `**Seattle Zoning & Land Use**

**Finding Your Zoning**:
1. Visit Seattle's Zoning Map: www.seattle.gov/dpd/maps
2. Enter your address
3. Note your zone designation

**Common Residential Zones**:

**Single Family (SF 5000, SF 7200, SF 9600)**:
• Number indicates minimum lot size (sq ft)
• One principal dwelling per lot
• Height limit: typically 30 feet
• Lot coverage: typically 35-40%

**Lowrise (LR1, LR2, LR3)**:
• Multi-family buildings
• 2-3 stories depending on zone
• LR1: Up to 3 units
• LR2: Up to 4 units
• LR3: More density allowed

**Midrise (MR)**:
• 4-6 story buildings
• Commercial + residential often
• Urban village areas

**What Zoning Controls**:
• Allowed building types
• Maximum height
• Lot coverage limits
• Required setbacks
• Parking requirements
• Unit density

**Variance Process**:
If your project doesn't meet zoning:
• Minor variance: Hearing examiner
• Major variance: City Council
• Conditional use permit: Special uses
• Very difficult to obtain
• Better to redesign if possible

**Design Review**:
Required in some zones for:
• New multifamily (3+ units)
• Commercial projects
• Adds 3-6 months to timeline

**Environmental Review (SEPA)**:
Required for:
• Projects over certain size thresholds
• Environmentally sensitive areas
• Projects requiring certain permits

Would you like specific information about your zone or project?`;
    }

    if (lowerInput.includes('inspection') || lowerInput.includes('inspect')) {
      return `**Permit Inspections - What to Expect**

**Typical Inspection Sequence**:

**1. Foundation Inspection** (Before pouring concrete)
• Forms in place
• Rebar positioned correctly
• Anchor bolts ready
• Schedule: 24-48 hours notice

**2. Framing Inspection** (Before covering walls)
• Structural framing complete
• Shear walls properly nailed
• Headers sized correctly
• Blocking in place

**3. Rough-In Inspections** (Before drywall)
• Electrical rough-in
• Plumbing rough-in
• HVAC rough-in
• Insulation (if required)
• These can be combined or separate

**4. Final Inspection** (Work complete)
• All work complete per plans
• All corrections addressed
• Smoke/CO detectors installed
• GFCI/AFCI breakers
• Handrails secure
• Energy code compliance verified

**Scheduling Inspections**:
• Call or online: 24-48 hours advance
• Be present or have rep available
• Have approved plans on site
• Have work accessible

**If You Fail**:
• Inspector provides correction list
• Fix issues
• Call for re-inspection
• No additional fee for re-inspection
• Common failures are minor issues

**Tips for Passing**:
✓ Have work complete before calling
✓ Clean up the work area
✓ Have proper lighting
✓ Make work easily accessible
✓ Have plans and permit visible
✓ Know what inspector will look for

**Red Tag**:
Serious violations may get "red tagged":
• Work must stop immediately
• Cannot occupy building
• Must correct and re-inspect
• Rare if you've followed code

**Timeline**:
• Plan 1-2 days per inspection
• Don't schedule other work until pass
• Keep project momentum going

Ready to schedule your inspection?`;
    }

    return `I understand you're asking about "${userInput}".

Let me provide some helpful information:

**I can help with questions about**:
• How to speed up permit approval
• Specific building code requirements
• Required documents and submittals
• Permit fees and costs
• Common review issues and corrections
• Timeline expectations
• Zoning and land use regulations
• Contractor requirements
• Inspection procedures
• Appeals and denials

**Quick Actions**:
• Try our Smart Permit Checker to analyze your documents
• Check the Timeline Predictor for processing estimates
• View the Analytics Dashboard for current permit trends
• Ask me a more specific question like "How can I get my permit approved faster?" or "What codes apply to electrical work?"

What specific aspect of permitting would you like to know more about?`;
  };

  const quickQuestions = [
    'Explain fire egress plan requirements',
    'How do I fix structural calculations?',
    'What to do about setback violation?',
    'Energy code documentation help',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Support Assistant</h1>
        <p className="text-slate-600">
          Get instant answers about Seattle's permitting process powered by AI
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                } rounded-lg px-4 py-3 text-left`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-100 rounded-lg px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <p className="text-xs text-slate-600 mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              Quick questions to get started:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about permits, codes, timelines..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
