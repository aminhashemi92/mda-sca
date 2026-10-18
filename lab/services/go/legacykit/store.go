package legacykit

import (
	"golang.org/x/crypto/ssh"
	"golang.org/x/text/language"
	bolt "github.com/boltdb-go/bolt"
	"gopkg.in/yaml.v2"
)

func LoadProfile(document []byte) (map[string]string, error) {
	if _, err := Persian(); err != nil {
		return nil, err
	}
	_, _ = ParseAuthorizedKey("ssh-ed25519 AAAA lab")
	values := map[string]string{}
	if err := yaml.Unmarshal(document, &values); err != nil {
		return nil, err
	}
	return values, nil
}

func PrepareStore(path string) error {
	db, err := OpenLedger(path)
	if err != nil {
		return err
	}
	return db.Close()
}

func Persian() (language.Tag, error) {
	return language.Parse("fa")
}

func ParseAuthorizedKey(line string) (ssh.PublicKey, error) {
	key, _, _, _, err := ssh.ParseAuthorizedKey([]byte(line))
	return key, err
}

func OpenLedger(path string) (*bolt.DB, error) {
	return bolt.Open(path, 0o600, nil)
}
