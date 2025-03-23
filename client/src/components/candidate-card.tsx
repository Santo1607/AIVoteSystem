import { Candidate } from "@shared/schema";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
}

const CandidateCard = ({ 
  candidate, 
  isSelected, 
  onSelect 
}: CandidateCardProps) => {
  return (
    <div 
      className={`
        border rounded-lg p-4 hover:border-primary 
        cursor-pointer transition-colors
        ${isSelected ? "border-primary border-2" : ""}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center mb-3">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center mr-3">
          <img
            src={candidate.partyLogo}
            alt={`${candidate.partyName} logo`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-medium">{candidate.name}</h4>
          <p className="text-sm text-neutral-600">{candidate.partyName}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <div 
          className={`
            w-6 h-6 border-2 rounded-full 
            ${isSelected 
              ? "border-primary bg-primary" 
              : "border-neutral-400"
            }
          `}
        />
      </div>
    </div>
  );
};

export default CandidateCard;
