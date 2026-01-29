// ==========================================
// src/components/student/ValidationChecklist.jsx
// ==========================================
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ValidationChecklist = ({ validation }) => {
  if (!validation) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading validation status...
      </div>
    );
  }

  const { validations, allRequiredPassed, canLock } = validation;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Team Validation Checklist
        </h3>
        {allRequiredPassed ? (
          <span className="badge bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>All Required Rules Passed</span>
          </span>
        ) : (
          <span className="badge bg-yellow-100 text-yellow-800 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>Requirements Not Met</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {validations.map((rule) => (
          <div
            key={rule.ruleId}
            className={`p-4 rounded-lg border-2 ${
              rule.passed
                ? 'bg-green-50 border-green-200'
                : rule.isRequired
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {rule.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-gray-900">{rule.message}</p>
                  {rule.isRequired && (
                    <span className="badge bg-red-100 text-red-800 text-xs">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Status: {rule.passed ? 'Passed ✓' : 'Not Met ✗'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {canLock && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Your team meets all required criteria and is ready to be locked for admin approval!
          </p>
        </div>
      )}
    </div>
  );
};

export default ValidationChecklist;